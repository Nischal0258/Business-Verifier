import asyncio
import logging
import sys
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import init_db, get_db, close_db
from db_models import FavoriteCompany, InternalStudentReview
from schemas import ApiResponse, CompanyStudentReport, FavoriteCompanyCreate, FavoriteCompanyResponse, InternalStudentReviewCreate, InternalStudentReviewResponse
from data_engine.student_score import calculate_student_trust_score
from utils import normalize_company_name

# Optional CrewAI imports
try:
    from agents.crew import build_student_report_crew, build_comparator_crew, build_conversational_crew
    HAS_CREWAI = True
except ImportError:
    HAS_CREWAI = False

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
    import traceback
    traceback.print_exc()
    sys.exit(1)


async def _validate_gemini_key():
    """Validate Gemini API key on startup."""
    if not settings.gemini_api_key:
        logger.warning("GEMINI_API_KEY not configured — CrewAI will use fallback mode")
        return
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)
        genai.list_models()
        logger.info("Gemini API key validated successfully")
    except Exception as e:
        logger.warning(f"Could not validate Gemini key: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    logger.info("Starting up Student-Focused Company Insights Platform...")
    try:
        asyncio.create_task(_validate_gemini_key())
        await init_db()
        logger.info("Startup complete. API ready to accept requests.")
    except Exception as e:
        logger.error(f"Startup error: {e}")
        import traceback
        traceback.print_exc()
        raise

    yield

    logger.info("Shutting down...")
    await close_db()
    logger.info("Shutdown complete.")


# Initialize FastAPI app
app = FastAPI(
    title="Student Company Insights Platform API",
    description="AI-driven conversational interface for company research and trust scores",
    version="2.0.0",
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


# ------------------------------------------------------------------------------
# Student Favorites Endpoints
# ------------------------------------------------------------------------------
@app.post("/api/v1/students/favorites", response_model=ApiResponse[FavoriteCompanyResponse])
async def add_favorite(data: FavoriteCompanyCreate, db: AsyncSession = Depends(get_db)):
    """Add a company to user's favorites."""
    normalized_name = normalize_company_name(data.company_name)
    existing = await db.execute(select(FavoriteCompany).where(FavoriteCompany.company_name == normalized_name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Company already in favorites")
    favorite = FavoriteCompany(company_name=normalized_name)
    db.add(favorite)
    await db.commit()
    await db.refresh(favorite)
    return ApiResponse(success=True, data=FavoriteCompanyResponse(id=favorite.id, company_name=favorite.company_name, added_at=favorite.added_at))


@app.delete("/api/v1/students/favorites/{company_name}", response_model=ApiResponse[None])
async def remove_favorite(company_name: str, db: AsyncSession = Depends(get_db)):
    """Remove a company from user's favorites."""
    normalized_name = normalize_company_name(company_name)
    favorite = await db.execute(select(FavoriteCompany).where(FavoriteCompany.company_name == normalized_name))
    favorite_obj = favorite.scalar_one_or_none()
    if not favorite_obj:
        raise HTTPException(status_code=404, detail="Company not in favorites")
    await db.delete(favorite_obj)
    await db.commit()
    return ApiResponse(success=True, data=None)


@app.get("/api/v1/students/favorites", response_model=ApiResponse[list[FavoriteCompanyResponse]])
async def get_favorites(db: AsyncSession = Depends(get_db)):
    """Get user's favorite companies."""
    result = await db.execute(select(FavoriteCompany).order_by(FavoriteCompany.added_at.desc()))
    favorites = result.scalars().all()
    return ApiResponse(
        success=True,
        data=[FavoriteCompanyResponse(id=f.id, company_name=f.company_name, added_at=f.added_at) for f in favorites]
    )


# ------------------------------------------------------------------------------
# Student Reviews Endpoints
# ------------------------------------------------------------------------------
@app.post("/api/v1/students/reviews", response_model=ApiResponse[InternalStudentReviewResponse])
async def submit_review(data: InternalStudentReviewCreate, db: AsyncSession = Depends(get_db)):
    """Submit a student review for a company."""
    normalized_name = normalize_company_name(data.company_name)
    review = InternalStudentReview(
        company_name=normalized_name,
        rating=data.rating,
        review_text=data.review_text,
        author_name=data.author_name
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return ApiResponse(
        success=True,
        data=InternalStudentReviewResponse(
            id=review.id,
            company_name=review.company_name,
            rating=review.rating,
            review_text=review.review_text,
            author_name=review.author_name,
            created_at=review.created_at
        )
    )


@app.get("/api/v1/students/reviews/{company_name}", response_model=ApiResponse[list[InternalStudentReviewResponse]])
async def get_company_reviews(company_name: str, db: AsyncSession = Depends(get_db)):
    """Get all reviews for a specific company."""
    normalized_name = normalize_company_name(company_name)
    result = await db.execute(
        select(InternalStudentReview).where(InternalStudentReview.company_name == normalized_name).order_by(InternalStudentReview.created_at.desc())
    )
    reviews = result.scalars().all()
    return ApiResponse(
        success=True,
        data=[InternalStudentReviewResponse(
            id=r.id,
            company_name=r.company_name,
            rating=r.rating,
            review_text=r.review_text,
            author_name=r.author_name,
            created_at=r.created_at
        ) for r in reviews]
    )


# ------------------------------------------------------------------------------
# CrewAI Endpoints (Optional)
# ------------------------------------------------------------------------------
if HAS_CREWAI:
    @app.post("/api/v1/students/chat", response_model=ApiResponse[dict])
    async def student_chat(query: dict):
        """Conversational interface powered by CrewAI Crew Manager."""
        user_query = query.get("query")
        if not user_query:
            raise HTTPException(status_code=400, detail="Query is required")
        try:
            crew = build_conversational_crew(user_query)
            result = await asyncio.to_thread(crew.kickoff)
            return ApiResponse(
                success=True,
                data={
                    "response": str(result),
                    "metadata": {
                        "agents_used": len(crew.agents),
                        "tasks_completed": len(crew.tasks)
                    }
                }
            )
        except Exception as e:
            logger.error(f"Error in student chat: {e}")
            import traceback
            traceback.print_exc()
            return ApiResponse(
                success=False,
                data=None,
                error=f"Failed to process query: {str(e)}"
            )


    @app.get("/api/v1/students/company/{company_name}", response_model=ApiResponse[CompanyStudentReport])
    async def get_student_company_report(company_name: str, db: AsyncSession = Depends(get_db)):
        """Get a student-focused company report with trust score via CrewAI."""
        if not settings.gemini_api_key:
            raise HTTPException(status_code=400, detail="Gemini API key not configured")
        try:
            crew = build_student_report_crew(company_name)
            result = await asyncio.to_thread(crew.kickoff)
            raw_output = str(result)
            report_data = {
                "company_name": company_name,
                "description": raw_output[:1000],
                "company_history": raw_output[:1500],
                "is_verified": True,
                "verification_score": 85,
                "social_media": {"website": f"https://{company_name.lower().replace(' ', '')}.com"},
                "opportunities": [],
                "total_opportunities": 0,
                "reviews": {},
                "growth": {"trend": "stable", "description": "Company is performing well"},
                "agent_execution_log": f"Crew executed {len(crew.tasks)} tasks with {len(crew.agents)} agents"
            }
            trust_score = calculate_student_trust_score(
                company_data=report_data,
                opportunities=report_data["opportunities"],
                social_media=report_data["social_media"],
                reviews=report_data["reviews"]
            )
            report_data["student_trust_score"] = trust_score
            report_data["verification_score"] = trust_score["total_score"]
            return ApiResponse(success=True, data=CompanyStudentReport(**report_data))
        except Exception as e:
            logger.error(f"Error getting company report: {e}")
            import traceback
            traceback.print_exc()
            return ApiResponse(success=False, data=None, error=f"Agent workflow failed: {str(e)}")


    @app.get("/api/v1/students/compare", response_model=ApiResponse[dict])
    async def compare_companies(companies: str):
        """Compare multiple companies side-by-side using CrewAI."""
        company_list = [c.strip() for c in companies.split(",") if c.strip()]
        if len(company_list) < 2:
            raise HTTPException(status_code=400, detail="Provide at least 2 companies to compare")
        try:
            crew = build_comparator_crew(company_list)
            result = await asyncio.to_thread(crew.kickoff)
            return ApiResponse(
                success=True,
                data={
                    "comparison": f"Comparing {len(company_list)} companies: {', '.join(company_list)}",
                    "result": str(result)
                }
            )
        except Exception as e:
            logger.error(f"Error comparing companies: {e}")
            import traceback
            traceback.print_exc()
            return ApiResponse(success=False, data=None, error=f"Comparison failed: {str(e)}")
else:
    @app.post("/api/v1/students/chat", response_model=ApiResponse[dict])
    async def student_chat(query: dict):
        """Chat without CrewAI"""
        return ApiResponse(success=False, data=None, error="CrewAI not installed. Please install CrewAI to use chat features.", metadata={"install": "pip install crewai[tools]>=0.11.0"})


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Welcome to Student Company Insights Platform", "docs": "/docs"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
