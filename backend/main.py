import asyncio
import json
import logging
import sys
import traceback
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Optional

from cachetools import TTLCache

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import init_db, get_db, close_db
from db_models import CachedReport
from schemas import ApiResponse, CompanyVerificationData
from pdf_generator import create_pdf, PDFGenerationError
from data_engine import generate_full_report
from data_engine.models import CompanyReport
from utils import normalize_company_name
from fts_search import init_fts5, fuzzy_search, update_fts5_entry
from tasks import schedule_prefetch_loop

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

try:
    logger.info("Testing logger - startup initiated")
    logger.info(f"Python version: {sys.version}")
    logger.info(f"Database URL: {settings.database_url}")
    logger.info(f"CORS origins: {settings.cors_origins}")
except Exception as e:
    print(f"ERROR during module import: {e}", file=sys.stderr)
    traceback.print_exc()
    sys.exit(1)


async def _validate_gemini_key():
    """Validate Gemini API key on startup."""
    import google.generativeai as genai
    if not settings.gemini_api_key:
        logger.warning("GEMINI_API_KEY not set — Gemini features will be disabled")
        return
    try:
        genai.configure(api_key=settings.gemini_api_key)
        # Quick check by listing models
        genai.list_models()
        logger.info("Gemini API key validated successfully")
    except Exception as e:
        logger.warning(f"Could not validate Gemini key: {e}. Gemini features may be limited.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    logger.info("Starting up Business Verification API...")

    try:
        asyncio.create_task(_validate_gemini_key())
        await init_db()

        # Initialize FTS5 full-text search index
        from database import get_db_session
        try:
            async with get_db_session() as db:
                await init_fts5(db)
        except Exception as e:
            logger.warning(f"FTS5 init skipped: {e}")

        # Start background pre-fetch loop (every 6 hours)
        from database import async_session_factory
        asyncio.create_task(
            schedule_prefetch_loop(async_session_factory, generate_full_report)
        )

        logger.info("Startup complete. API ready to accept requests.")
    except Exception as e:
        logger.error(f"Startup error: {e}")
        traceback.print_exc()
        raise

    yield

    logger.info("Shutting down...")
    await close_db()
    logger.info("Shutdown complete.")


# Initialize FastAPI app
app = FastAPI(
    title="Business Verification & Analytics API",
    description="API for verifying companies and generating PDF reports",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory LRU cache — 500 entries, 1 hour TTL
_hot_cache: TTLCache = TTLCache(maxsize=500, ttl=3600)


def _parse_turnover_json(turnover_json: Optional[str]) -> list:
    """Parse turnover JSON string to list."""
    if not turnover_json:
        return []
    try:
        return json.loads(turnover_json)
    except json.JSONDecodeError:
        return []


def _parse_sources_json(sources_json: Optional[str]) -> list:
    """Parse sources JSON string to list."""
    if not sources_json:
        return []
    try:
        return json.loads(sources_json)
    except json.JSONDecodeError:
        return []


def _company_report_to_dict(db_report: CachedReport) -> dict:
    """Convert database CachedReport to dictionary format."""
    return {
        "company_name": db_report.company_name,
        "is_verified": db_report.is_verified,
        "verification_score": db_report.verification_score or 0,
        "company_history": db_report.history_text or "",
        "jurisdiction": db_report.jurisdiction,
        "incorporation_date": db_report.incorporation_date,
        "turnover_data": _parse_turnover_json(db_report.turnover_json),
        "sources": _parse_sources_json(db_report.sources_json)
    }


async def _get_cached_report(db: AsyncSession, company_name: str) -> Optional[CachedReport]:
    """Query database for cached report by normalized company name."""
    normalized = normalize_company_name(company_name)
    result = await db.execute(
        select(CachedReport).where(
            CachedReport.company_name.ilike(normalized)
        )
    )
    return result.scalar_one_or_none()


async def _is_cache_stale(report: CachedReport) -> bool:
    """Check if cached report is older than 30 days."""
    if not report.updated_at:
        return True
    
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    return report.updated_at < thirty_days_ago


async def _save_report_to_cache(db: AsyncSession, company_name: str, data: dict) -> CachedReport:
    """Save or update report in database cache using normalized name."""
    normalized = normalize_company_name(company_name)
    existing = await _get_cached_report(db, normalized)
    
    if existing:
        existing.is_verified = data.get("is_verified", False)
        existing.verification_score = data.get("verification_score", 0)
        existing.history_text = data.get("company_history")
        existing.turnover_json = json.dumps(data.get("turnover_data", []))
        existing.jurisdiction = data.get("jurisdiction")
        existing.incorporation_date = data.get("incorporation_date")
        existing.sources_json = json.dumps(data.get("sources", []))
        existing.updated_at = datetime.utcnow()
    else:
        existing = CachedReport(
            company_name=normalized,
            is_verified=data.get("is_verified", False),
            verification_score=data.get("verification_score", 0),
            history_text=data.get("company_history"),
            turnover_json=json.dumps(data.get("turnover_data", [])),
            jurisdiction=data.get("jurisdiction"),
            incorporation_date=data.get("incorporation_date"),
            sources_json=json.dumps(data.get("sources", [])),
            updated_at=datetime.utcnow()
        )
        db.add(existing)
    
    await db.commit()
    await db.refresh(existing)

    # Update in-memory cache
    _hot_cache[normalized] = _company_report_to_dict(existing)

    # Update FTS5 index
    try:
        await update_fts5_entry(db, existing.id, normalized)
    except Exception:
        pass  # FTS5 is optional

    return existing


@app.get("/api/verify/{company_name}", response_model=ApiResponse[CompanyVerificationData])
async def verify_company(company_name: str, db: AsyncSession = Depends(get_db)):
    """
    Verify a company and return verification data.
    L1: in-memory cache → L2: SQLite cache → L3: live fetch.
    """
    normalized = normalize_company_name(company_name)

    try:
        # L1: In-memory cache (sub-millisecond)
        if normalized in _hot_cache:
            logger.info(f"Memory cache hit for '{normalized}'")
            data = _hot_cache[normalized]
            return ApiResponse(
                success=True,
                data=CompanyVerificationData(**data),
                error=None,
                metadata={"cached": True, "cache_layer": "memory"}
            )

        # L2: SQLite cache
        cached = await _get_cached_report(db, normalized)

        if cached and not await _is_cache_stale(cached):
            logger.info(f"DB cache hit for '{normalized}'")
            data = _company_report_to_dict(cached)
            _hot_cache[normalized] = data  # Promote to L1
            return ApiResponse(
                success=True,
                data=CompanyVerificationData(**data),
                error=None,
                metadata={"cached": True, "cache_layer": "database", "updated_at": cached.updated_at.isoformat()}
            )

        # L2.5: FTS5 fuzzy search fallback
        fuzzy_results = await fuzzy_search(db, normalized, limit=1)
        if fuzzy_results:
            best = fuzzy_results[0]
            logger.info(f"FTS5 fuzzy match: '{normalized}' → '{best['company_name']}'")
            cached = await _get_cached_report(db, best["company_name"])
            if cached and not await _is_cache_stale(cached):
                data = _company_report_to_dict(cached)
                _hot_cache[normalized] = data
                return ApiResponse(
                    success=True,
                    data=CompanyVerificationData(**data),
                    error=None,
                    metadata={"cached": True, "cache_layer": "fts5_fuzzy", "matched": best["company_name"]}
                )

        # L3: Live fetch
        logger.info(f"Cache miss — live fetching '{normalized}'")
        report: CompanyReport = await generate_full_report(company_name)

        report_data = report.model_dump()
        if "sources" not in report_data:
            report_data["sources"] = []

        # Detect mock mode from summarizer
        is_mock = report_data.get("_is_mock", False)
        report_data.pop("_is_mock", None)

        await _save_report_to_cache(db, normalized, report_data)

        metadata = {"cached": False, "source": "live_fetch"}
        if is_mock:
            metadata["source"] = "mock_mode"
            metadata["warning"] = "LLM API key not configured. Summary is placeholder data."

        return ApiResponse(
            success=True,
            data=CompanyVerificationData(**report_data),
            error=None,
            metadata=metadata
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying company '{normalized}': {e}")
        return ApiResponse(
            success=False,
            data=None,
            error=f"Internal server error: {str(e)}",
            metadata=None
        )


@app.get("/api/verify/{company_name}/pdf")
async def verify_company_pdf(company_name: str, db: AsyncSession = Depends(get_db)):
    """
    Generate and download a PDF report for a company.
    """
    try:
        # Get verification data (from cache or fresh)
        verify_response = await verify_company(company_name, db)

        if not verify_response.success or not verify_response.data:
            # Return error as JSON since we can't return PDF
            return ApiResponse(
                success=False,
                data=None,
                error="Could not generate PDF: company verification failed",
                metadata=None
            )

        # Prepare data for PDF
        pdf_data = verify_response.data.model_dump()
        pdf_data["company_name"] = company_name

        # Generate PDF
        pdf_bytes = create_pdf(pdf_data)

        # Return as streaming response
        return StreamingResponse(
            iter([pdf_bytes]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=\"{company_name.replace(' ', '_')}_report.pdf\""
            }
        )

    except Exception as e:
        logger.error(f"Error generating PDF for {company_name}: {e}")
        return ApiResponse(
            success=False,
            data=None,
            error=f"PDF generation failed: {str(e)}",
            metadata=None
        )


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to the Business Verification & Analytics API",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


from agents.crew import build_student_report_crew, build_comparator_crew
from schemas import CompanyStudentReport
from data_engine.student_score import calculate_student_trust_score

@app.get("/api/v1/student/company/{company_name}", response_model=ApiResponse[CompanyStudentReport])
async def get_student_company_report(company_name: str, db: AsyncSession = Depends(get_db)):
    """
    Triggers CrewAI to research a company and return a student-first report.
    This kicks off the hierarchical agent workflow asynchronously.
    """
    if not settings.gemini_api_key:
        return ApiResponse(
            success=False,
            data=None,
            error="Gemini API key is required. Please configure GEMINI_API_KEY.",
            metadata=None
        )
    
    try:
        crew = build_student_report_crew(company_name)
        
        # Run CrewAI synchronously in a separate thread so we don't block FastAPI's event loop
        result = await asyncio.to_thread(crew.kickoff)
        
        raw_output = str(result)
        
        # Parse agent outputs into structured data
        # The crew returns results from 5 sequential tasks
        report_data = {
            "company_name": company_name,
            "description": raw_output[:500] if raw_output else "",
            "company_history": raw_output[:800] if raw_output else "",
            "is_verified": True,
            "verification_score": 0,
            "social_media": {},
            "opportunities": [],
            "total_opportunities": 0,
            "reviews": {},
            "growth": {"trend": "unknown", "description": ""},
            "agent_execution_log": f"CrewAI executed {len(crew.tasks)} tasks with {len(crew.agents)} agents."
        }
        
        # Calculate real trust score using the algorithm
        trust_score = calculate_student_trust_score(
            company_data=report_data,
            opportunities=report_data.get("opportunities", []),
            social_media=report_data.get("social_media", {}),
            reviews=report_data.get("reviews", {}),
        )
        report_data["student_trust_score"] = trust_score
        report_data["verification_score"] = trust_score["total_score"]
        
        return ApiResponse(
            success=True,
            data=CompanyStudentReport(**report_data),
            error=None,
            metadata={"source": "crew_ai", "agents_used": len(crew.agents), "tasks_completed": len(crew.tasks)}
        )
    except Exception as e:
        logger.error(f"Error running CrewAI for {company_name}: {e}")
        traceback.print_exc()
        return ApiResponse(
            success=False,
            data=None,
            error=f"Agent workflow failed: {str(e)}",
            metadata=None
        )


@app.get("/api/v1/student/compare")
async def compare_companies(companies: str):
    """
    Compare multiple companies side-by-side.
    Pass comma-separated company names in query, e.g., ?companies=Google,Microsoft,Amazon
    """
    company_list = [c.strip() for c in companies.split(",") if c.strip()]
    if len(company_list) < 2:
        return ApiResponse(
            success=False,
            data=None,
            error="Please provide at least 2 companies to compare.",
            metadata=None
        )
        
    try:
        crew = build_comparator_crew(company_list)
        result = await asyncio.to_thread(crew.kickoff)
        
        return ApiResponse(
            success=True,
            data={
                "comparison": f"Comparing {len(company_list)} companies: {', '.join(company_list)}",
                "result": str(result)
            },
            error=None,
            metadata={"companies_compared": company_list, "source": "crew_ai"}
        )
    except Exception as e:
        logger.error(f"Error running CrewAI compare for {company_list}: {e}")
        return ApiResponse(
            success=False,
            data=None,
            error=f"Comparison failed: {str(e)}",
            metadata=None
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
