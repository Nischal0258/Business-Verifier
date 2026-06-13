"""Service layer for job discovery, company onboarding, and student matching."""

import json
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime

from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from db_models import (
    CachedOpportunity,
    CachedReview,
    CachedSocialMedia,
    User,
    FavoriteCompany,
    InternalStudentReview,
)
from database import get_db_session

logger = logging.getLogger(__name__)


class JobService:
    """Service for managing job discovery, company data, and student operations."""

    async def get_opportunities(
        self,
        location: Optional[str] = None,
        industry: Optional[str] = None,
        job_type: Optional[str] = None,
        company_name: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Get available internship/job opportunities with filtering.
        """
        try:
            async with get_db_session() as db:
                stmt = select(CachedOpportunity).where(CachedOpportunity.is_active == True)

                conditions = []
                if location:
                    conditions.append(CachedOpportunity.location.ilike(f"%{location}%"))
                if job_type:
                    conditions.append(CachedOpportunity.type.ilike(f"%{job_type}%"))
                if company_name:
                    conditions.append(CachedOpportunity.company_name.ilike(f"%{company_name}%"))
                if search:
                    conditions.append(
                        or_(
                            CachedOpportunity.title.ilike(f"%{search}%"),
                            CachedOpportunity.company_name.ilike(f"%{search}%"),
                        )
                    )

                if conditions:
                    stmt = stmt.where(and_(*conditions))

                stmt = stmt.order_by(CachedOpportunity.fetched_at.desc()).limit(limit)
                result = await db.execute(stmt)
                rows = result.scalars().all()

                return [
                    {
                        "id": r.id,
                        "company_name": r.company_name,
                        "title": r.title,
                        "location": r.location,
                        "type": r.type,
                        "stipend": r.stipend,
                        "apply_url": r.apply_url,
                        "source": r.source,
                        "fetched_at": r.fetched_at.isoformat() if r.fetched_at else None,
                    }
                    for r in rows
                ]
        except Exception as e:
            logger.error(f"Get opportunities failed: {e}")
            return []

    async def store_opportunity(self, opp: Dict[str, Any]) -> Optional[int]:
        """
        Store a discovered opportunity in the database.
        """
        try:
            async with get_db_session() as db:
                cached = CachedOpportunity(
                    company_name=opp.get("company_name", ""),
                    title=opp.get("title", ""),
                    location=opp.get("location", ""),
                    type=opp.get("type", "Internship"),
                    stipend=opp.get("stipend", ""),
                    apply_url=opp.get("apply_url", ""),
                    source=opp.get("source", "CrewAI"),
                    is_active=True,
                    fetched_at=datetime.utcnow(),
                )
                db.add(cached)
                await db.commit()
                await db.refresh(cached)
                return cached.id
        except Exception as e:
            logger.error(f"Store opportunity failed: {e}")
            return None

    async def get_company_review(self, company_name: str) -> Optional[Dict[str, Any]]:
        """Get aggregated Glassdoor-style review data for a company."""
        try:
            async with get_db_session() as db:
                stmt = select(CachedReview).where(
                    CachedReview.company_name.ilike(company_name)
                )
                result = await db.execute(stmt)
                row = result.scalar_one_or_none()

                if row:
                    return {
                        "company_name": row.company_name,
                        "overall_rating": row.overall_rating,
                        "review_count": row.review_count,
                        "pros": json.loads(row.pros_json) if row.pros_json else [],
                        "cons": json.loads(row.cons_json) if row.cons_json else [],
                        "student_verdict": row.student_verdict,
                        "source": row.source,
                        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
                    }
                return None
        except Exception as e:
            logger.error(f"Get company review failed: {e}")
            return None

    async def store_company_review(
        self,
        company_name: str,
        overall_rating: Optional[float] = None,
        review_count: int = 0,
        pros: Optional[List[str]] = None,
        cons: Optional[List[str]] = None,
        student_verdict: Optional[str] = None,
        source: str = "CrewAI",
    ) -> Optional[int]:
        """Store aggregated review data for a company."""
        try:
            async with get_db_session() as db:
                stmt = select(CachedReview).where(
                    CachedReview.company_name.ilike(company_name)
                )
                result = await db.execute(stmt)
                existing = result.scalar_one_or_none()

                if existing:
                    existing.overall_rating = overall_rating
                    existing.review_count = review_count
                    existing.pros_json = json.dumps(pros or [])
                    existing.cons_json = json.dumps(cons or [])
                    existing.student_verdict = student_verdict
                    existing.source = source
                    existing.updated_at = datetime.utcnow()
                else:
                    new_review = CachedReview(
                        company_name=company_name,
                        overall_rating=overall_rating,
                        review_count=review_count,
                        pros_json=json.dumps(pros or []),
                        cons_json=json.dumps(cons or []),
                        student_verdict=student_verdict,
                        source=source,
                        updated_at=datetime.utcnow(),
                    )
                    db.add(new_review)

                await db.commit()
                return 1
        except Exception as e:
            logger.error(f"Store company review failed: {e}")
            return None

    async def get_social_media(self, company_name: str) -> Optional[Dict[str, Any]]:
        """Get social media profile URLs for a company."""
        try:
            async with get_db_session() as db:
                stmt = select(CachedSocialMedia).where(
                    CachedSocialMedia.company_name.ilike(company_name)
                )
                result = await db.execute(stmt)
                row = result.scalar_one_or_none()

                if row:
                    return {
                        "company_name": row.company_name,
                        "linkedin_url": row.linkedin_url,
                        "instagram_url": row.instagram_url,
                        "twitter_url": row.twitter_url,
                        "facebook_url": row.facebook_url,
                        "youtube_url": row.youtube_url,
                        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
                    }
                return None
        except Exception as e:
            logger.error(f"Get social media failed: {e}")
            return None

    async def store_social_media(
        self,
        company_name: str,
        linkedin_url: Optional[str] = None,
        instagram_url: Optional[str] = None,
        twitter_url: Optional[str] = None,
        facebook_url: Optional[str] = None,
        youtube_url: Optional[str] = None,
    ) -> Optional[int]:
        """Store social media profile URLs for a company."""
        try:
            async with get_db_session() as db:
                stmt = select(CachedSocialMedia).where(
                    CachedSocialMedia.company_name.ilike(company_name)
                )
                result = await db.execute(stmt)
                existing = result.scalar_one_or_none()

                if existing:
                    existing.linkedin_url = linkedin_url
                    existing.instagram_url = instagram_url
                    existing.twitter_url = twitter_url
                    existing.facebook_url = facebook_url
                    existing.youtube_url = youtube_url
                    existing.updated_at = datetime.utcnow()
                else:
                    new_social = CachedSocialMedia(
                        company_name=company_name,
                        linkedin_url=linkedin_url,
                        instagram_url=instagram_url,
                        twitter_url=twitter_url,
                        facebook_url=facebook_url,
                        youtube_url=youtube_url,
                        updated_at=datetime.utcnow(),
                    )
                    db.add(new_social)

                await db.commit()
                return 1
        except Exception as e:
            logger.error(f"Store social media failed: {e}")
            return None

    async def add_internal_review(
        self,
        user_id: int,
        company_name: str,
        rating: float,
        review_text: str,
        is_internship: bool = True,
    ) -> Optional[int]:
        """Add a student-submitted review (mini-Glassdoor)."""
        try:
            async with get_db_session() as db:
                new_review = InternalStudentReview(
                    user_id=user_id,
                    company_name=company_name,
                    rating=rating,
                    review_text=review_text,
                    is_internship=is_internship,
                    created_at=datetime.utcnow(),
                )
                db.add(new_review)
                await db.commit()
                await db.refresh(new_review)
                return new_review.id
        except Exception as e:
            logger.error(f"Add internal review failed: {e}")
            return None

    async def get_internal_reviews(
        self, company_name: str, limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get all student-submitted reviews for a company."""
        try:
            async with get_db_session() as db:
                stmt = (
                    select(InternalStudentReview)
                    .where(InternalStudentReview.company_name.ilike(company_name))
                    .order_by(InternalStudentReview.created_at.desc())
                    .limit(limit)
                )
                result = await db.execute(stmt)
                rows = result.scalars().all()

                return [
                    {
                        "id": r.id,
                        "user_id": r.user_id,
                        "rating": r.rating,
                        "review_text": r.review_text,
                        "is_internship": r.is_internship,
                        "created_at": r.created_at.isoformat() if r.created_at else None,
                    }
                    for r in rows
                ]
        except Exception as e:
            logger.error(f"Get internal reviews failed: {e}")
            return []

    async def add_favorite(self, user_id: int, company_name: str) -> Optional[int]:
        """Add a company to user's favorites."""
        try:
            async with get_db_session() as db:
                stmt = select(FavoriteCompany).where(
                    and_(
                        FavoriteCompany.user_id == user_id,
                        FavoriteCompany.company_name.ilike(company_name),
                    )
                )
                result = await db.execute(stmt)
                existing = result.scalar_one_or_none()

                if existing:
                    return existing.id

                fav = FavoriteCompany(
                    user_id=user_id,
                    company_name=company_name,
                    alerts_enabled=True,
                )
                db.add(fav)
                await db.commit()
                await db.refresh(fav)
                return fav.id
        except Exception as e:
            logger.error(f"Add favorite failed: {e}")
            return None

    async def remove_favorite(self, user_id: int, company_name: str) -> bool:
        """Remove a company from user's favorites."""
        try:
            async with get_db_session() as db:
                stmt = select(FavoriteCompany).where(
                    and_(
                        FavoriteCompany.user_id == user_id,
                        FavoriteCompany.company_name.ilike(company_name),
                    )
                )
                result = await db.execute(stmt)
                existing = result.scalar_one_or_none()

                if existing:
                    await db.delete(existing)
                    await db.commit()
                    return True
                return False
        except Exception as e:
            logger.error(f"Remove favorite failed: {e}")
            return False

    async def get_user_favorites(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all favorites for a user."""
        try:
            async with get_db_session() as db:
                stmt = (
                    select(FavoriteCompany)
                    .where(FavoriteCompany.user_id == user_id)
                    .order_by(FavoriteCompany.id.desc())
                )
                result = await db.execute(stmt)
                rows = result.scalars().all()

                return [
                    {
                        "id": r.id,
                        "company_name": r.company_name,
                        "alerts_enabled": r.alerts_enabled,
                    }
                    for r in rows
                ]
        except Exception as e:
            logger.error(f"Get user favorites failed: {e}")
            return []
