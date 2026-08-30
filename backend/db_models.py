from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Index, Float, ForeignKey
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class CachedReport(Base):
    """Database model for cached company verification reports."""
    __tablename__ = "cached_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(255), unique=True, index=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_score = Column(Integer, default=0, nullable=True)
    history_text = Column(Text, nullable=True)
    turnover_json = Column(Text, nullable=True)  # JSON string
    jurisdiction = Column(String(100), nullable=True)
    incorporation_date = Column(String(50), nullable=True)
    sources_json = Column(Text, nullable=True)  # JSON string of sources list
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, index=True)
    
    __table_args__ = (
        Index('idx_updated_at', 'updated_at'),
    )
    
    def __repr__(self):
        return f"<CachedReport(company_name='{self.company_name}', is_verified={self.is_verified}, updated_at={self.updated_at})>"


class CachedOpportunity(Base):
    __tablename__ = "cached_opportunities"
    id = Column(Integer, primary_key=True)
    company_name = Column(String(255), index=True)
    title = Column(String(500))
    location = Column(String(200))
    type = Column(String(50))
    stipend = Column(String(100))
    apply_url = Column(Text)
    source = Column(String(100))
    is_active = Column(Boolean, default=True)
    fetched_at = Column(DateTime, default=datetime.utcnow)

class CachedReview(Base):
    __tablename__ = "cached_reviews"
    id = Column(Integer, primary_key=True)
    company_name = Column(String(255), unique=True, index=True)
    overall_rating = Column(Float)
    review_count = Column(Integer, default=0)
    pros_json = Column(Text)
    cons_json = Column(Text)
    student_verdict = Column(Text)
    source = Column(String(100))
    updated_at = Column(DateTime, default=datetime.utcnow)

class CachedSocialMedia(Base):
    __tablename__ = "cached_social_media"
    id = Column(Integer, primary_key=True)
    company_name = Column(String(255), unique=True, index=True)
    linkedin_url = Column(Text)
    instagram_url = Column(Text)
    twitter_url = Column(Text)
    facebook_url = Column(Text)
    youtube_url = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow)

# --- USER & FEEDBACK MODELS ---

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

class FavoriteCompany(Base):
    __tablename__ = "favorite_companies"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    company_name = Column(String(255), index=True)
    alerts_enabled = Column(Boolean, default=True)

class InternalStudentReview(Base):
    """Students' own reviews (the mini-Glassdoor)."""
    __tablename__ = "internal_reviews"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    company_name = Column(String(255), index=True)
    rating = Column(Float)
    review_text = Column(Text)
    is_internship = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
