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

# --- NEW MODELS ---

class SocialMediaLinks(BaseModel):
    """Company social media presence."""
    linkedin_url: Optional[str] = None
    instagram_url: Optional[str] = None
    twitter_url: Optional[str] = None
    facebook_url: Optional[str] = None
    youtube_url: Optional[str] = None
    active_platforms: List[str] = Field(default_factory=list)
    social_presence_score: int = 0

class OpportunityItem(BaseModel):
    """Single internship or job listing."""
    title: str
    company_name: str
    location: str = "Remote"
    type: str = "internship"
    stipend: Optional[str] = None
    duration: Optional[str] = None
    skills_required: List[str] = Field(default_factory=list)
    apply_url: str = ""
    posted_date: Optional[str] = None
    source: str = ""
    is_active: bool = True

class CompanyReviewSummary(BaseModel):
    """Aggregated reviews — prominently displayed."""
    overall_rating: Optional[float] = None
    work_life_balance: Optional[float] = None
    career_growth: Optional[float] = None
    salary_satisfaction: Optional[float] = None
    review_count: int = 0
    recommend_to_friend_pct: Optional[int] = None
    top_pros: List[str] = Field(default_factory=list)
    top_cons: List[str] = Field(default_factory=list)
    student_verdict: str = ""
    source: str = ""
    source_url: Optional[str] = None

class GrowthIndicator(BaseModel):
    """Minimal financial info — just growth direction, NOT raw revenue."""
    trend: str = "unknown"
    growth_pct: Optional[float] = None
    description: str = ""

class StudentTrustScore(BaseModel):
    """Student-oriented company trust score (0-100)."""
    total_score: int = Field(default=0, ge=0, le=100)
    is_recommended: bool = False
    company_tier: str = "unknown"
    breakdown: Dict[str, int] = Field(default_factory=dict)
    verdict: str = ""

class CompanyStudentReport(BaseModel):
    """The main response model — everything a student needs."""
    company_name: str
    industry: Optional[str] = None
    sector: Optional[str] = None
    founded: Optional[str] = None
    employee_count: Optional[int] = None
    website: Optional[str] = None
    description: str = ""
    headquarters: Optional[str] = None
    founders: List[str] = Field(default_factory=list)
    
    student_trust_score: StudentTrustScore = Field(default_factory=StudentTrustScore)
    social_media: SocialMediaLinks = Field(default_factory=SocialMediaLinks)
    opportunities: List[OpportunityItem] = Field(default_factory=list)
    total_opportunities: int = 0
    reviews: CompanyReviewSummary = Field(default_factory=CompanyReviewSummary)
    growth: GrowthIndicator = Field(default_factory=GrowthIndicator)
    
    company_history: str = ""
    is_verified: bool = False
    verification_score: int = 0
    
    citation_sources: List[CitationSourceItem] = Field(default_factory=list)
    agent_execution_log: Optional[str] = None

# --- USER & FEEDBACK MODELS ---

class UserCreate(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime
    class Config:
        from_attributes = True

class FavoriteCompanyCreate(BaseModel):
    company_name: str
    alerts_enabled: bool = True

class FavoriteCompanyResponse(BaseModel):
    id: int
    company_name: str
    alerts_enabled: bool
    class Config:
        from_attributes = True

class InternalStudentReviewCreate(BaseModel):
    rating: float = Field(..., ge=1.0, le=5.0)
    review_text: str
    is_internship: bool = True

class InternalStudentReviewResponse(BaseModel):
    id: int
    user_id: int
    company_name: str
    rating: float
    review_text: str
    is_internship: bool
    created_at: datetime
    class Config:
        from_attributes = True
