from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Generic, TypeVar
from datetime import datetime

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """
    Generic envelope response model for all API endpoints.
    Provides consistent response structure across the API.
    """
    success: bool = Field(..., description="Whether the request was successful")
    data: Optional[T] = Field(None, description="Response data payload")
    error: Optional[str] = Field(None, description="Error message if success is false")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata (timestamp, cache status, etc.)")


class TurnoverDataItem(BaseModel):
    """Individual turnover/revenue data item."""
    year: int
    revenue: Optional[float] = None
    note: Optional[str] = None


class FounderProfileItem(BaseModel):
    name: str
    biography: Optional[str] = None
    founding_role: Optional[str] = None
    current_position: Optional[str] = None
    photo_url: Optional[str] = None
    source: Optional[str] = None


class HeadquartersInfoItem(BaseModel):
    full_address: Optional[str] = None
    founding_date: Optional[str] = None
    facility_details: Optional[str] = None
    map_query: Optional[str] = None


class GlobalOperationItem(BaseModel):
    country: str
    office_locations: List[str] = Field(default_factory=list)
    service_offerings: List[str] = Field(default_factory=list)
    source: Optional[str] = None


class CitationSourceItem(BaseModel):
    title: str
    url: Optional[str] = None
    publisher: Optional[str] = None
    verified: bool = False


class CompanyVerificationData(BaseModel):
    """Company verification response data structure."""
    is_verified: bool
    verification_score: int = Field(default=0, ge=0, le=100)
    company_history: str
    jurisdiction: Optional[str] = None
    incorporation_date: Optional[str] = None
    turnover_data: List[TurnoverDataItem] = Field(default_factory=list)
    sources: List[str] = Field(default_factory=list)
    founder_profiles: List[FounderProfileItem] = Field(default_factory=list)
    headquarters_info: HeadquartersInfoItem = Field(default_factory=HeadquartersInfoItem)
    global_operations: List[GlobalOperationItem] = Field(default_factory=list)
    citation_sources: List[CitationSourceItem] = Field(default_factory=list)
    chapter_last_updated: Optional[str] = None
    employee_count: Optional[int] = None
    market_cap: Optional[float] = None


class CachedReportResponse(BaseModel):
    """Database model representation for API responses."""
    id: int
    company_name: str
    is_verified: bool
    history_text: Optional[str]
    turnover_data: List[TurnoverDataItem]
    jurisdiction: Optional[str]
    incorporation_date: Optional[str]
    sources: List[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ErrorResponse(BaseModel):
    """Standard error response structure."""
    success: bool = False
    error: str
    data: None = None
    metadata: Optional[Dict[str, Any]] = None
