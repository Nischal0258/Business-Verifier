"""Business verification logic with real data scoring."""

import logging
from typing import Any, Dict, List, Tuple

logger = logging.getLogger(__name__)


def verify_company(
    registry_data: Dict[str, Any],
    financial_data: List[Dict[str, Any]],
) -> Tuple[bool, int]:
    """Evaluate whether a business is legitimate using real data signals.

    Scoring rules (0-100)
    ---------------------
    - Active market status:            +25 points
    - Has real company description:    +15 points
    - Has industry/sector data:        +10 points
    - Has revenue history:             +20 points
    - Revenue magnitude:               up to +20 points
    - Has website:                     +5 points
    - Has employee count:              +5 points

    Parameters
    ----------
    registry_data:
        Dictionary with company metadata from Yahoo Finance / web search.
    financial_data:
        List of revenue records (``year`` / ``revenue``).

    Returns
    -------
    Tuple[bool, int]
        ``(is_verified, verification_score)`` where *score* is 0–100.
    """
    score = 0

    # 1. Registration / market status (max 25)
    status = str(registry_data.get("status", "")).lower()
    if status == "active":
        score += 25
    elif status == "found":
        score += 15
    elif status in {"dissolved", "liquidated"}:
        score += 0
    else:
        score += 5  # partial for unknown

    # 2. Company description available (max 15)
    desc = registry_data.get("description")
    if desc and len(str(desc)) > 100:
        score += 15
    elif desc and len(str(desc)) > 20:
        score += 8

    # 3. Industry/sector data (max 10)
    if registry_data.get("industry"):
        score += 5
    if registry_data.get("sector"):
        score += 5

    # 4. Financial data presence (max 20)
    real_revenue_records = [
        r for r in financial_data
        if r.get("revenue", 0) > 0
    ]
    if len(real_revenue_records) >= 3:
        score += 20
    elif len(real_revenue_records) >= 1:
        score += 12
    elif financial_data:
        score += 5

    # 5. Revenue magnitude bonus (max 20)
    if real_revenue_records:
        latest_revenue = real_revenue_records[0].get("revenue", 0)
        if latest_revenue > 100_000_000_000:  # $100B+
            score += 20
        elif latest_revenue > 10_000_000_000:  # $10B+
            score += 18
        elif latest_revenue > 1_000_000_000:   # $1B+
            score += 15
        elif latest_revenue > 100_000_000:     # $100M+
            score += 12
        elif latest_revenue > 10_000_000:      # $10M+
            score += 8
        elif latest_revenue > 0:
            score += 3

    # 6. Website (max 5)
    if registry_data.get("website"):
        score += 5

    # 7. Employee count (max 5)
    if registry_data.get("employees") and registry_data["employees"] > 0:
        score += 5

    # Determine verification
    has_positive_revenue = any(
        record.get("revenue", 0) > 0 for record in financial_data
    )
    is_verified = (
        status in {"active", "found"}
        and score >= 40
    )

    logger.info(
        "Verification for '%s': verified=%s, score=%d, status=%s, revenue_records=%d",
        registry_data.get("company_name", "?"),
        is_verified,
        score,
        status,
        len(real_revenue_records),
    )

    return is_verified, min(max(score, 0), 100)
