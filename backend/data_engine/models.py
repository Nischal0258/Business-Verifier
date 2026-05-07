"""Pydantic data models for the Business Verification pipeline."""

from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class FounderProfile(BaseModel):
    """Founder/leadership profile shown in company information chapter."""

    name: str
    biography: Optional[str] = None
    founding_role: Optional[str] = None
    current_position: Optional[str] = None
    photo_url: Optional[str] = None
    source: Optional[str] = None


class HeadquartersInfo(BaseModel):
    """Headquarters chapter data."""

    full_address: Optional[str] = None
    founding_date: Optional[str] = None
    facility_details: Optional[str] = None
    map_query: Optional[str] = None


class GlobalOperation(BaseModel):
    """Country-level operation details."""

    country: str
    office_locations: List[str] = Field(default_factory=list)
    service_offerings: List[str] = Field(default_factory=list)
    source: Optional[str] = None


class CitationSource(BaseModel):
    """Citation metadata for displayed information."""

    title: str
    url: Optional[str] = None
    publisher: Optional[str] = None
    verified: bool = False


class CompanyReport(BaseModel):
    """Standardized output for a company verification report."""

    company_name: str = Field(
        ...,
        description="The canonical name of the company.",
    )
    is_verified: bool = Field(
        ...,
        description="Whether the business is considered legitimate.",
    )
    verification_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Legitimacy score from 0 to 100.",
    )
    turnover_data: List[dict] = Field(
        default_factory=list,
        description="List of dictionaries mapping 'year' -> 'revenue'.",
    )
    company_history: str = Field(
        ...,
        description="A professional, 3-paragraph company history.",
    )
    jurisdiction: Optional[str] = Field(
        default=None,
        description="Country or jurisdiction of registration.",
    )
    incorporation_date: Optional[str] = Field(
        default=None,
        description="Date of incorporation or registration.",
    )
    founder_profiles: List[FounderProfile] = Field(default_factory=list)
    headquarters_info: HeadquartersInfo = Field(default_factory=HeadquartersInfo)
    global_operations: List[GlobalOperation] = Field(default_factory=list)
    citation_sources: List[CitationSource] = Field(default_factory=list)
    chapter_last_updated: Optional[str] = None
    employee_count: Optional[int] = None
    market_cap: Optional[float] = None

    @field_validator("turnover_data", mode="before")
    @classmethod
    def _coerce_turnover(cls, value):
        """Ensure turnover_data is a list even if None is passed."""
        if value is None:
            return []
        return value

    model_config = {
        "json_schema_extra": {
            "example": {
                "company_name": "Apple Inc.",
                "is_verified": True,
                "verification_score": 100,
                "turnover_data": [
                    {"year": 2024, "revenue": 391035000000, "note": "Source: Yahoo Finance (AAPL)"},
                    {"year": 2023, "revenue": 383285000000, "note": "Source: Yahoo Finance (AAPL)"},
                ],
                "company_history": (
                    "Apple Inc. was founded in 1976 by Steve Jobs..."
                ),
                "jurisdiction": "United States",
                "incorporation_date": None,
                "founder_profiles": [
                    {
                        "name": "Steve Jobs",
                        "biography": "American entrepreneur and co-founder of Apple.",
                        "founding_role": "Co-founder",
                        "current_position": "N/A",
                        "photo_url": None,
                        "source": "Wikipedia",
                    }
                ],
                "headquarters_info": {
                    "full_address": "One Apple Park Way, Cupertino, CA 95014, United States",
                    "founding_date": "1976-04-01",
                    "facility_details": "Apple Park campus and executive headquarters",
                    "map_query": "One Apple Park Way, Cupertino, CA 95014",
                },
                "global_operations": [
                    {
                        "country": "United States",
                        "office_locations": ["Cupertino, California"],
                        "service_offerings": ["Consumer electronics", "Software", "Cloud services"],
                        "source": "Apple investor relations",
                    }
                ],
                "citation_sources": [
                    {
                        "title": "Apple Company Profile",
                        "url": "https://www.apple.com",
                        "publisher": "Apple",
                        "verified": True,
                    }
                ],
                "chapter_last_updated": "2026-05-07T00:00:00Z",
                "employee_count": 161000,
                "market_cap": 2900000000000,
            }
        }
    }
