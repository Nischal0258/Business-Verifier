"""Data Engine package for Business Verification and Analytics."""

import logging
import os

from .main import generate_full_report
from .models import CompanyReport

logger = logging.getLogger(__name__)

if not os.getenv("GEMINI_API_KEY"):
    logger.warning(
        "GEMINI_API_KEY environment variable is not set. "
        "Summarization features will be disabled."
    )

__all__ = ["generate_full_report", "CompanyReport"]
