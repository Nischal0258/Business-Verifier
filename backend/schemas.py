from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Generic, TypeVar

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


class CompanyVerificationData(BaseModel):
    """Company verification response data structure."""
    is_verified: bool
    verification_score: int = Field(default=0, ge=0, le=100)
    company_history: str
    jurisdiction: Optional[str] = None
    incorporation_date: Optional[str] = None
    turnover_data: List[TurnoverDataItem] = Field(default_factory=list)
    sources: List[str] = Field(default_factory=list)


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
