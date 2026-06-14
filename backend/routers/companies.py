"""Company-focused API routes for Phase 4: onboarding, social media, reviews, and opportunities."""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas import (
    ApiResponse,
    SocialMediaLinks,
    CompanyReviewSummary,
    OpportunityItem,
)
from services.job_service import JobService
import asyncio

# Optional import for CrewAI
try:
    from agents.crew import build_student_report_crew
    HAS_CREWAI = True
except ImportError:
    HAS_CREWAI = False

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/companies", tags=["Companies"])

job_service = JobService()


@router.get("/{company_name}/social", response_model=ApiResponse[SocialMediaLinks])
async def get_company_social(company_name: str, db: AsyncSession = Depends(get_db)):
    """Get company social media profiles."""
    try:
        social = await job_service.get_social_media(company_name=company_name)
        if social:
            return ApiResponse(
                success=True,
                data=SocialMediaLinks(
                    linkedin_url=social.get("linkedin_url"),
                    instagram_url=social.get("instagram_url"),
                    twitter_url=social.get("twitter_url"),
                    facebook_url=social.get("facebook_url"),
                    youtube_url=social.get("youtube_url"),
                    active_platforms=[
                        k.replace("_url", "")
                        for k, v in social.items()
                        if k.endswith("_url") and v
                    ],
                ),
                error=None,
                metadata=None,
            )
        else:
            return ApiResponse(
                success=True,
                data=SocialMediaLinks(),
                error=None,
                metadata={"message": "No social media data found for this company"},
            )
    except Exception as e:
        logger.error(f"Get company social failed: {e}")
        return ApiResponse(
            success=False,
            data=None,
            error=f"Failed to fetch social media: {str(e)}",
            metadata=None,
        )


@router.get("/{company_name}/reviews", response_model=ApiResponse[CompanyReviewSummary])
async def get_company_reviews_summary(company_name: str, db: AsyncSession = Depends(get_db)):
    """Get aggregated Glassdoor-style reviews for a company."""
    try:
        review = await job_service.get_company_review(company_name=company_name)
        if review:
            return ApiResponse(
                success=True,
                data=CompanyReviewSummary(
                    overall_rating=review.get("overall_rating"),
                    review_count=review.get("review_count", 0),
                    top_pros=review.get("pros", []),
                    top_cons=review.get("cons", []),
                    student_verdict=review.get("student_verdict", ""),
                    source=review.get("source", ""),
                ),
                error=None,
                metadata=None,
            )
        else:
            return ApiResponse(
                success=True,
                data=CompanyReviewSummary(),
                error=None,
                metadata={"message": "No review data found for this company"},
            )
    except Exception as e:
        logger.error(f"Get company reviews summary failed: {e}")
        return ApiResponse(
            success=False,
            data=None,
            error=f"Failed to fetch reviews: {str(e)}",
            metadata=None,
        )


@router.get("/{company_name}/opportunities", response_model=ApiResponse[list[OpportunityItem]])
async def get_company_opportunities(company_name: str, limit: int = 20, db: AsyncSession = Depends(get_db)):
    """Get opportunities for a specific company."""
    try:
        opportunities = await job_service.get_opportunities(
            company_name=company_name, limit=limit
        )
        opportunity_items = [
            OpportunityItem(
                id=opp.get("id"),
                title=opp.get("title", ""),
                company_name=opp.get("company_name", ""),
                location=opp.get("location", "Remote"),
                type=opp.get("type", "internship"),
                stipend=opp.get("stipend"),
                apply_url=opp.get("apply_url", ""),
                source=opp.get("source", ""),
                is_active=True,
            )
            for opp in opportunities
        ]
        return ApiResponse(
            success=True,
            data=opportunity_items,
            error=None,
            metadata={"company": company_name, "count": len(opportunity_items)},
        )
    except Exception as e:
        logger.error(f"Get company opportunities failed: {e}")
        return ApiResponse(
            success=False,
            data=None,
            error=f"Failed to fetch opportunities: {str(e)}",
            metadata=None,
        )


@router.post("/{company_name}/refresh", response_model=ApiResponse[dict])
async def refresh_company_data(company_name: str, db: AsyncSession = Depends(get_db)):
    """Trigger CrewAI to refresh all company data (reviews, social, opportunities)."""
    from config import settings

    if not HAS_CREWAI:
        return ApiResponse(
            success=False,
            data=None,
            error="CrewAI is not installed. Please install dependencies from requirements.txt.",
            metadata=None,
        )

    if not settings.gemini_api_key:
        return ApiResponse(
            success=False,
            data=None,
            error="Gemini API key is required. Please configure GEMINI_API_KEY.",
            metadata=None,
        )

    try:
        crew = build_student_report_crew(company_name)
        result = await asyncio.to_thread(crew.kickoff)
        return ApiResponse(
            success=True,
            data={"message": "Company data refresh initiated", "result": str(result)},
            error=None,
            metadata={"agents_used": len(crew.agents), "tasks_completed": len(crew.tasks)},
        )
    except Exception as e:
        logger.error(f"Refresh company data failed: {e}")
        return ApiResponse(
            success=False,
            data=None,
            error=f"Failed to refresh data: {str(e)}",
            metadata=None,
        )
