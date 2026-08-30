"""Routers package for Phase 3 and 4 API endpoints."""

from .students import router as students_router
from .companies import router as companies_router

__all__ = ["students_router", "companies_router"]
