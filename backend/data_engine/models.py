"""Pydantic models for the data engine pipeline."""

from typing import List, Optional
from pydantic import BaseModel, Field


class TurnoverEntry(BaseModel):
    """Single year turnover data point."""
    year: str = ""
    amount: float = 0.0
    currency: str = "INR"


class SourceEntry(BaseModel):
    """Data source reference with reliability type."""
    url: str = ""
    title: str = ""
    type: str = "web_scrape"  # government_registry | stock_exchange | financial_database | news_source | web_scrape


class CompanyReport(BaseModel):
    """Full company verification report returned by the data engine."""
    company_name: str
    is_verified: bool = False
    verification_score: float = Field(default=0.0, ge=0, le=100)
    company_history: str = ""
    jurisdiction: Optional[str] = None
    incorporation_date: Optional[str] = None
    turnover_data: List[TurnoverEntry] = Field(default_factory=list)
    sources: List[SourceEntry] = Field(default_factory=list)
    _is_mock: bool = False
