"""Utility functions for company name normalization and text processing."""

import re
from typing import Optional


# Common company suffixes to strip for normalized matching
_SUFFIX_PATTERNS = [
    r'\b(pvt|private)\s*(ltd|limited)\.?',
    r'\b(ltd|limited|inc|incorporated|corp|corporation|llc|llp)\.?',
    r'\b(co|company)\.?',
    r'\b(plc|sa|ag|gmbh|bv|nv|pty|srl|spa)\.?',
    r'\b(group|holdings|enterprises?)\.?',
]

_COMPILED_SUFFIXES = [re.compile(p, re.IGNORECASE) for p in _SUFFIX_PATTERNS]


def normalize_company_name(name: Optional[str]) -> str:
    """Normalize company name for consistent cache matching.

    Strips whitespace, lowercases, removes common legal suffixes,
    and collapses internal whitespace to single spaces.

    Parameters
    ----------
    name:
        Raw company name from user input.

    Returns
    -------
    str
        Normalized name suitable for cache keys and DB lookups.

    Examples
    --------
    >>> normalize_company_name("  Apple INC.  ")
    'apple'
    >>> normalize_company_name("Infosys Pvt Ltd")
    'infosys'
    >>> normalize_company_name("Tata Consultancy Services Limited")
    'tata consultancy services'
    >>> normalize_company_name("  RELIANCE   INDUSTRIES   LTD.  ")
    'reliance industries'
    """
    if not name:
        return ""

    # Strip and lowercase
    result = name.strip().lower()

    # Remove special characters except spaces and alphanumerics
    result = re.sub(r'[^\w\s]', ' ', result)

    # Remove common suffixes
    for pattern in _COMPILED_SUFFIXES:
        result = pattern.sub('', result)

    # Collapse whitespace
    result = re.sub(r'\s+', ' ', result).strip()

    return result
