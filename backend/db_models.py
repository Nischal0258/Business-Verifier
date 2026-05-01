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
