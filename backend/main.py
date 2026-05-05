import asyncio
import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Optional

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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


async def _validate_openai_key():
    """Validate OpenAI API key on startup."""
    import openai
    
    if not settings.openai_api_key:
        raise RuntimeError(
            "OPENAI_API_KEY environment variable is required but not set. "
            "Please set it in your .env file or environment variables."
        )
    
    # Test the key with a simple request
    try:
        client = openai.AsyncOpenAI(api_key=settings.openai_api_key)
        # Make a minimal request to validate the key
        await client.models.list()
        logger.info("OpenAI API key validated successfully")
    except openai.AuthenticationError:
        raise RuntimeError(
            "Invalid OPENAI_API_KEY. Please check your API key and try again."
        )
    except Exception as e:
        logger.warning(f"Could not fully validate OpenAI key: {e}")
        # Don't fail startup for network issues, but log the warning


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    logger.info("Starting up Business Verification API...")

    if not settings.openai_api_key:
        logger.warning("OPENAI_API_KEY not set — OpenAI features will be disabled")
    else:
        try:
            asyncio.create_task(_validate_openai_key())
        except Exception as e:
            logger.warning(f"Failed to initiate OpenAI key validation: {e}")

    await init_db()
    logger.info("Startup complete. API ready to accept requests.")
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
    except Exception as e:
        logger.error(f"Error verifying company {company_name}: {e}")
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
