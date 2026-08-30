"""Student-focused API routes for Phase 3: favorites, reviews, and matching."""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas import (
    ApiResponse,
    FavoriteCompanyCreate,
    FavoriteCompanyResponse,
    InternalStudentReviewCreate,
    InternalStudentReviewResponse,
    OpportunityItem,
)
from services.job_service import JobService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/students", tags=["Students"])

job_service = JobService()


@router.get("/opportunities", response_model=ApiResponse[List[OpportunityItem]])
async def get_opportunities(
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    company_name: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
):
    """Get filtered internship/job opportunities for students."""
    try:
        opportunities = await job_service.get_opportunities(
            location=location,
            job_type=job_type,
            company_name=company_name,
            search=search,
            limit=limit,
        )
        # Convert to OpportunityItem models
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
            metadata={"count": len(opportunity_items)},
        )
    except Exception as e:
        logger.error(f"Get opportunities failed: {e}")
        return ApiResponse(
            success=False,
            data=None,
            error=f"Failed to fetch opportunities: {str(e)}",
            metadata=None,
        )


@router.post("/favorites", response_model=ApiResponse[FavoriteCompanyResponse])
async def add_favorite(
    favorite: FavoriteCompanyCreate, db: AsyncSession = Depends(get_db)
):
    """Add a company to student's favorites."""
    try:
        # For now, using hardcoded user_id=1 since auth isn't implemented yet
        user_id = 1
        fav_id = await job_service.add_favorite(
            user_id=user_id, company_name=favorite.company_name
        )
        if fav_id:
            return ApiResponse(
                success=True,
                data=FavoriteCompanyResponse(
                    id=fav_id,
                    company_name=favorite.company_name,
                    alerts_enabled=favorite.alerts_enabled,
                ),
                error=None,
                metadata=None,
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add favorite",
            )
    except Exception as e:
        logger.error(f"Add favorite failed: {e}")
        return ApiResponse(
            success=False,
            data=None,
            error=f"Failed to add favorite: {str(e)}",
            metadata=None,
        )


@router.delete("/favorites/{company_name}", response_model=ApiResponse[dict])
async def remove_favorite(company_name: str, db: AsyncSession = Depends(get_db)):
    """Remove a company from student's favorites."""
    try:
        user_id = 1
        success = await job_service.remove_favorite(
            user_id=user_id, company_name=company_name
        )
        return ApiResponse(
            success=success,
            data={"removed": success},
            error=None if success else "Company not found in favorites",
            metadata=None,
        )
    except Exception as e:
        logger.error(f"Remove favorite failed: {e}")
        return ApiResponse(
            success=False,
            data=None,
            error=f"Failed to remove favorite: {str(e)}",
            metadata=None,
        )


@router.get("/favorites", response_model=ApiResponse[List[FavoriteCompanyResponse]])
async def get_favorites(db: AsyncSession = Depends(get_db)):
    """Get student's favorite companies."""
    try:
        user_id = 1
        favorites = await job_service.get_user_favorites(user_id=user_id)
        return ApiResponse(
            success=True,
            data=[
                FavoriteCompanyResponse(**fav)
                for fav in favorites
            ],
            error=None,
            metadata={"count": len(favorites)},
        )
    except Exception as e:
        logger.error(f"Get favorites failed: {e}")
        return ApiResponse(
            success=False,
            data=None,
            error=f"Failed to fetch favorites: {str(e)}",
            metadata=None,
        )


@router.post("/reviews", response_model=ApiResponse[InternalStudentReviewResponse])
async def submit_review(
    review: InternalStudentReviewCreate, db: AsyncSession = Depends(get_db)
):
    """Submit an internal student review for a company."""
    try:
        user_id = 1
        review_id = await job_service.add_internal_review(
            user_id=user_id,
            company_name=review.company_name,
            rating=review.rating,
            review_text=review.review_text,
            is_internship=review.is_internship,
        )
        if review_id:
            return ApiResponse(
                success=True,
                data=InternalStudentReviewResponse(
                    id=review_id,
                    user_id=user_id,
                    company_name=review.company_name,
                    rating=review.rating,
                    review_text=review.review_text,
                    is_internship=review.is_internship,
                    created_at=__import__("datetime").datetime.utcnow(),
                ),
                error=None,
                metadata=None,
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to submit review",
            )
    except Exception as e:
        logger.error(f"Submit review failed: {e}")
        return ApiResponse(
            success=False,
            data=None,
            error=f"Failed to submit review: {str(e)}",
            metadata=None,
        )


@router.get("/reviews/{company_name}", response_model=ApiResponse[List[InternalStudentReviewResponse]])
async def get_company_reviews(company_name: str, limit: int = 20, db: AsyncSession = Depends(get_db)):
    """Get internal student reviews for a specific company."""
    try:
        reviews = await job_service.get_internal_reviews(
            company_name=company_name, limit=limit
        )
        return ApiResponse(
            success=True,
            data=[
                InternalStudentReviewResponse(**review)
                for review in reviews
            ],
            error=None,
            metadata={"company": company_name, "count": len(reviews)},
        )
    except Exception as e:
        logger.error(f"Get company reviews failed: {e}")
        return ApiResponse(
            success=False,
            data=None,
            error=f"Failed to fetch reviews: {str(e)}",
            metadata=None,
        )
