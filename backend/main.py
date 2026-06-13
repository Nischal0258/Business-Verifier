import asyncio
import json
from sqlalchemy.future import select
from db_models import CachedOpportunity, CachedSocialMedia, CachedReview
from database import get_db
from fastapi import Depends
import logging
import sys
import traceback
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Optional, List

import httpx
from pydantic import BaseModel
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
    """Query database for cached report by company name (case-insensitive)."""
    result = await db.execute(
        select(CachedReport).where(
            CachedReport.company_name.ilike(company_name)
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
    """Save or update report in database cache."""
    # Check for existing report
    existing = await _get_cached_report(db, company_name)
    
    if existing:
        # Update existing
        existing.is_verified = data.get("is_verified", False)
        existing.verification_score = data.get("verification_score", 0)
        existing.history_text = data.get("company_history")
        existing.turnover_json = json.dumps(data.get("turnover_data", []))
        existing.jurisdiction = data.get("jurisdiction")
        existing.incorporation_date = data.get("incorporation_date")
        existing.sources_json = json.dumps(data.get("sources", []))
        existing.updated_at = datetime.utcnow()
    else:
        # Create new
        existing = CachedReport(
            company_name=company_name,
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
    return existing


@app.get("/api/verify/{company_name}", response_model=ApiResponse[CompanyVerificationData])
async def verify_company(company_name: str, db: AsyncSession = Depends(get_db)):
    """
    Verify a company and return verification data.
    Checks cache first, then fetches from web if needed.
    """
    try:
        # Check cache first
        cached = await _get_cached_report(db, company_name)
        
        if cached and not await _is_cache_stale(cached):
            # Cache hit - fresh data
            logger.info(f"Cache hit for {company_name}")
            data = _company_report_to_dict(cached)
            return ApiResponse(
                success=True,
                data=CompanyVerificationData(**data),
                error=None,
                metadata={"cached": True, "updated_at": cached.updated_at.isoformat()}
            )
        
        # Cache miss or stale - fetch new data
        logger.info(f"Fetching data for {company_name}")
        
        # Fetch from data engine (returns CompanyReport Pydantic model)
        report: CompanyReport = await generate_full_report(company_name)
        
        # Convert CompanyReport to dict and add missing fields for API compatibility
        report_data = report.model_dump()
        if "sources" not in report_data:
            report_data["sources"] = []
        
        # Save to cache
        await _save_report_to_cache(db, company_name, report_data)
        
        return ApiResponse(
            success=True,
            data=CompanyVerificationData(**report_data),
            error=None,
            metadata={"cached": False, "source": "live_fetch"}
        )
        
    except HTTPException:
        raise
    except httpx.HTTPError as e:
        logger.error(f"Network error verifying company {company_name}: {e}")
        return ApiResponse(
            success=False,
            data=None,
            error=f"Network error: Could not reach data sources. Please check your internet connection and try again. Details: {str(e)[:100]}",
            metadata=None
        )
    except Exception as e:
        logger.error(f"Error verifying company {company_name}: {e}")
        import traceback
        traceback.print_exc()
        return ApiResponse(
            success=False,
            data=None,
            error=f"Verification failed: {str(e)[:150]}",
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



class CompareRequest(BaseModel):
    companies: List[str]

@app.post("/api/v1/student/compare")
async def compare_companies(request: CompareRequest):
    try:
        from agents.crew import build_comparator_crew
        crew = build_comparator_crew(request.companies)
        result = await asyncio.to_thread(crew.kickoff)
        try:
            comparison_data = json.loads(result.raw)
        except:
            comparison_data = {"raw_output": result.raw}
        return {"success": True, "comparison": comparison_data}
    except Exception as e:
        logger.error(f"Error comparing companies: {e}")
        return {"success": False, "error": str(e)}

@app.get("/api/company/{company_name}/report")
async def get_company_report(company_name: str):
    try:
        from agents.crew import build_student_report_crew
        crew = build_student_report_crew(company_name)
        result = await asyncio.to_thread(crew.kickoff)
        try:
            report_data = json.loads(result.raw)
        except:
            report_data = {"raw_output": result.raw}
        return {"success": True, "report": report_data}
    except Exception as e:
        logger.error(f"Error generating report for {company_name}: {e}")
        return {"success": False, "error": str(e)}

@app.get("/api/company/{company_name}/opportunities")
async def get_company_opportunities(company_name: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CachedOpportunity).where(CachedOpportunity.company_name.ilike(company_name)))
    opps = result.scalars().all()
    opportunities = [{
        "title": o.title, "company_name": o.company_name, "location": o.location,
        "type": o.type, "stipend": o.stipend, "apply_url": o.apply_url, "source": o.source
    } for o in opps]
    return {"success": True, "opportunities": opportunities}

@app.get("/api/company/{company_name}/social")
async def get_company_social(company_name: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CachedSocialMedia).where(CachedSocialMedia.company_name.ilike(company_name)))
    social = result.scalar_one_or_none()
    if social:
        data = {
            "linkedin_url": social.linkedin_url, "instagram_url": social.instagram_url,
            "twitter_url": social.twitter_url, "facebook_url": social.facebook_url
        }
    else:
        data = {}
    return {"success": True, "social": data}

@app.get("/api/company/{company_name}/reviews")
async def get_company_reviews(company_name: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CachedReview).where(CachedReview.company_name.ilike(company_name)))
    review = result.scalar_one_or_none()
    if review:
        data = {
            "overall_rating": review.overall_rating, "review_count": review.review_count,
            "pros": json.loads(review.pros_json) if review.pros_json else [],
            "cons": json.loads(review.cons_json) if review.cons_json else [],
            "student_verdict": review.student_verdict
        }
    else:
        data = {}
    return {"success": True, "reviews": data}

@app.get("/api/explore")
async def explore_opportunities(q: str = "", location: str = "", type: str = "all", industry: str = "", min_stipend: int = 0, company_tier: str = "all", sort: str = "relevance", page: int = 1, limit: int = 20, db: AsyncSession = Depends(get_db)):
    query = select(CachedOpportunity)
    if q:
        query = query.where(CachedOpportunity.title.ilike(f"%{q}%"))
    if location:
        query = query.where(CachedOpportunity.location.ilike(f"%{location}%"))
    if type and type != "all":
        query = query.where(CachedOpportunity.type.ilike(type))
    
    # Exclude those without title or company
    query = query.where(CachedOpportunity.title.isnot(None))
    
    query = query.limit(limit).offset((page - 1) * limit)
    result = await db.execute(query)
    opps = result.scalars().all()
    
    opportunities = [{
        "title": o.title, "company_name": o.company_name, "location": o.location,
        "type": o.type, "stipend": o.stipend, "apply_url": o.apply_url, "source": o.source,
        "company_tier": "Rising Star", "trust_score": 75, "skills_required": []
    } for o in opps]
    return {"success": True, "opportunities": opportunities, "total": len(opportunities)}

@app.get("/api/company/{company_name}/report/pdf")
async def get_company_report_pdf(company_name: str):
    try:
        from agents.crew import build_student_report_crew
        from pdf_generator import create_student_pdf
        crew = build_student_report_crew(company_name)
        result = await asyncio.to_thread(crew.kickoff)
        try:
            report_data = json.loads(result.raw)
        except:
            report_data = {"raw_output": result.raw}
        
        pdf_bytes = create_student_pdf(report_data)
        return StreamingResponse(
            iter([pdf_bytes]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{company_name.replace(" ", "_")}_student_report.pdf"'
            }
        )
    except Exception as e:
        logger.error(f"Error generating student PDF for {company_name}: {e}")
        return {"success": False, "error": str(e)}



if __name__ == "__main__":

    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
import asyncio
from typing import List
from pydantic import BaseModel

class CompareRequest(BaseModel):
    companies: List[str]

@app.post("/api/v1/student/compare")
async def compare_companies(request: CompareRequest):
    try:
        from agents.crew import build_comparator_crew
        crew = build_comparator_crew(request.companies)
        # CrewAI kickoff is synchronous, so we run it in a thread
        result = await asyncio.to_thread(crew.kickoff)
        # Parse the output assuming the agent returns JSON
        try:
            comparison_data = json.loads(result.raw)
        except:
            comparison_data = {"raw_output": result.raw}
        return {"success": True, "comparison": comparison_data}
    except Exception as e:
        logger.error(f"Error comparing companies: {e}")
        return {"success": False, "error": str(e)}

@app.get("/api/company/{company_name}/report")
async def get_company_report(company_name: str):
    try:
        from agents.crew import build_student_report_crew
        crew = build_student_report_crew(company_name)
        result = await asyncio.to_thread(crew.kickoff)
        try:
            report_data = json.loads(result.raw)
        except:
            report_data = {"raw_output": result.raw}
        return {"success": True, "report": report_data}
    except Exception as e:
        logger.error(f"Error generating report for {company_name}: {e}")
        return {"success": False, "error": str(e)}
