"""Student Trust Score — scores companies 0-100 from a student's perspective.

Evaluates six dimensions that matter most to students looking for internships
and entry-level roles: hiring activity, employee reviews, social presence,
company legitimacy, intern friendliness, and growth trajectory.
"""

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Tier boundaries
# ---------------------------------------------------------------------------
_TIER_THRESHOLDS: List[tuple[int, str]] = [
    (80, "established"),
    (60, "rising_star"),
    (40, "emerging"),
    (0,  "unknown"),
]

# ---------------------------------------------------------------------------
# Verdict templates (keyed by tier)
# ---------------------------------------------------------------------------
_VERDICTS: Dict[str, str] = {
    "established": (
        "{name} is a well-established company with strong hiring activity "
        "and solid reputation — highly recommended for students."
    ),
    "rising_star": (
        "{name} shows promising signals with good presence and active "
        "hiring — worth applying to."
    ),
    "emerging": (
        "{name} is an emerging company; do your own research but there "
        "are some positive indicators."
    ),
    "unknown": (
        "Not enough data to confidently evaluate {name} — proceed with "
        "caution and verify independently."
    ),
}


# ======================================================================== #
#  Individual scoring helpers (pure functions, easy to unit-test)           #
# ======================================================================== #

def _score_hiring_activity(opportunities: List[Dict[str, Any]]) -> int:
    """Score based on number of open job/intern listings (0-25)."""
    count = len(opportunities) if opportunities else 0

    if count == 0:
        pts = 0
    elif count <= 3:
        pts = 10
    elif count <= 10:
        pts = 18
    else:
        pts = 25

    logger.debug("Hiring activity: %d opportunities → %d pts", count, pts)
    return pts


def _score_employee_reviews(reviews: Dict[str, Any]) -> int:
    """Score based on Glassdoor / AmbitionBox rating (0-20).

    A missing rating is treated as neutral (5 pts) rather than a penalty
    because many legitimate startups simply lack reviews.
    """
    rating: Optional[float] = reviews.get("rating") if reviews else None

    if rating is None:
        pts = 5
    elif rating < 2.5:
        pts = 3
    elif rating < 3.5:
        pts = 10
    elif rating < 4.0:
        pts = 16
    else:
        pts = 20

    logger.debug("Employee reviews: rating=%s → %d pts", rating, pts)
    return pts


def _score_social_media(social_media: Dict[str, Any]) -> int:
    """Score based on number of active social-media platforms (0-15)."""
    if not social_media:
        return 0

    # Count platforms with a truthy URL / handle
    platform_count = sum(1 for v in social_media.values() if v)

    if platform_count == 0:
        pts = 0
    elif platform_count <= 2:
        pts = 7
    elif platform_count <= 4:
        pts = 12
    else:
        pts = 15

    logger.debug("Social media: %d active platforms → %d pts", platform_count, pts)
    return pts


def _score_company_legitimacy(company_data: Dict[str, Any]) -> int:
    """Score based on foundational company data from Company Scout (0-15).

    Points are additive:
      - website exists      → +5
      - description found   → +4
      - industry identified → +3
      - HQ / location known → +3
    """
    pts = 0

    if company_data.get("website"):
        pts += 5
    if company_data.get("description"):
        pts += 4
    if company_data.get("industry") or company_data.get("sector"):
        pts += 3
    if company_data.get("hq") or company_data.get("location") or company_data.get("jurisdiction"):
        pts += 3

    logger.debug("Company legitimacy: %d pts", pts)
    return pts


def _score_intern_friendliness(opportunities: List[Dict[str, Any]]) -> int:
    """Score based on intern-specific opportunity quality (0-15).

    Points are additive:
      - has 'intern' listings    → +8
      - stipend info available   → +4
      - duration specified       → +3
    """
    if not opportunities:
        return 0

    pts = 0

    has_intern = any(
        "intern" in str(opp.get("title", "")).lower()
        or "intern" in str(opp.get("type", "")).lower()
        for opp in opportunities
    )
    if has_intern:
        pts += 8

    has_stipend = any(
        opp.get("stipend") or opp.get("salary") or opp.get("compensation")
        for opp in opportunities
    )
    if has_stipend:
        pts += 4

    has_duration = any(
        opp.get("duration")
        for opp in opportunities
    )
    if has_duration:
        pts += 3

    logger.debug(
        "Intern friendliness: intern=%s, stipend=%s, duration=%s → %d pts",
        has_intern, has_stipend, has_duration, pts,
    )
    return pts


def _score_growth_signals(company_data: Dict[str, Any]) -> int:
    """Score based on financial growth trajectory (0-10).

    Expects ``company_data`` to optionally contain a ``growth_yoy`` (float,
    percentage) or ``turnover_data`` list from which YoY can be inferred.

    No data → 3 pts (neutral), declining → 0, stable → 5,
    growing (>0 %) → 7, fast growing (>30 %) → 10.
    """
    growth_yoy: Optional[float] = company_data.get("growth_yoy")

    # Try to derive from turnover_data if explicit growth_yoy absent
    if growth_yoy is None:
        turnover: list = company_data.get("turnover_data", [])
        if len(turnover) >= 2:
            # Assume sorted oldest → newest; take last two
            try:
                prev = float(turnover[-2].get("amount", 0) if isinstance(turnover[-2], dict) else turnover[-2])
                curr = float(turnover[-1].get("amount", 0) if isinstance(turnover[-1], dict) else turnover[-1])
                if prev > 0:
                    growth_yoy = ((curr - prev) / prev) * 100
            except (TypeError, ValueError, ZeroDivisionError):
                growth_yoy = None

    if growth_yoy is None:
        pts = 3  # neutral — absence is not a red flag
    elif growth_yoy < 0:
        pts = 0
    elif growth_yoy == 0:
        pts = 5
    elif growth_yoy <= 30:
        pts = 7
    else:
        pts = 10

    logger.debug("Growth signals: yoy=%s → %d pts", growth_yoy, pts)
    return pts


# ======================================================================== #
#  Tier & verdict helpers                                                  #
# ======================================================================== #

def _classify_tier(total_score: int) -> str:
    """Map a numeric score to a human-readable tier label."""
    for threshold, tier in _TIER_THRESHOLDS:
        if total_score >= threshold:
            return tier
    return "unknown"  # defensive fallback


def _generate_verdict(company_name: str, tier: str) -> str:
    """Return a 1-sentence verdict for the given tier."""
    template = _VERDICTS.get(tier, _VERDICTS["unknown"])
    return template.format(name=company_name)


# ======================================================================== #
#  Public API                                                              #
# ======================================================================== #

def calculate_student_trust_score(
    company_data: dict,
    opportunities: list,
    social_media: dict,
    reviews: dict,
) -> dict:
    """Calculate Student Trust Score (0-100).

    Evaluates a company across six dimensions weighted towards what
    matters most to students and interns.

    Parameters
    ----------
    company_data:
        Core company metadata from Company Scout (website, description,
        industry, hq, turnover_data, growth_yoy …).
    opportunities:
        List of job/intern listings found (each a dict with at least
        ``title``; optionally ``type``, ``stipend``, ``duration``).
    social_media:
        Dict of platform → URL/handle (e.g. ``{"linkedin": "…", …}``).
    reviews:
        Employee review summary (expects ``rating`` as a float 0-5).

    Returns
    -------
    dict
        ``total_score``  – int 0-100
        ``is_recommended`` – bool (score ≥ 60)
        ``company_tier``   – 'established' | 'rising_star' | 'emerging' | 'unknown'
        ``breakdown``      – dict mapping category name → points awarded
        ``verdict``        – 1-sentence human-readable summary
    """
    company_name: str = company_data.get("company_name", "Unknown Company")

    # --- score each dimension ---
    breakdown: Dict[str, int] = {
        "hiring_activity":     _score_hiring_activity(opportunities),
        "employee_reviews":    _score_employee_reviews(reviews),
        "social_media":        _score_social_media(social_media),
        "company_legitimacy":  _score_company_legitimacy(company_data),
        "intern_friendliness": _score_intern_friendliness(opportunities),
        "growth_signals":      _score_growth_signals(company_data),
    }

    total_score: int = min(max(sum(breakdown.values()), 0), 100)
    tier: str = _classify_tier(total_score)
    is_recommended: bool = total_score >= 60

    result: Dict[str, Any] = {
        "total_score":    total_score,
        "is_recommended": is_recommended,
        "company_tier":   tier,
        "breakdown":      breakdown,
        "verdict":        _generate_verdict(company_name, tier),
    }

    logger.info(
        "Student Trust Score for '%s': %d/100 (tier=%s, recommended=%s)",
        company_name, total_score, tier, is_recommended,
    )

    return result
