from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Index
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
    
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, index=True)
    title = Column(String)
    location = Column(String)
    type = Column(String)
    stipend = Column(String)
    apply_url = Column(String)
    source = Column(String)
    fetched_at = Column(DateTime, default=datetime.utcnow)

class CachedReview(Base):
    __tablename__ = "cached_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, unique=True, index=True)
    overall_rating = Column(Float)
    review_count = Column(Integer)
    pros_json = Column(Text)
    cons_json = Column(Text)
    student_verdict = Column(Text)

class CachedSocialMedia(Base):
    __tablename__ = "cached_social_media"
    
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, unique=True, index=True)
    linkedin_url = Column(String)
    instagram_url = Column(String)
    twitter_url = Column(String)
    facebook_url = Column(String)
