"""Pydantic data models for the Business Verification pipeline."""

from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


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
            }
        }
    }

