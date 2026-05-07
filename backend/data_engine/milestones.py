"""Real-time milestone scraper for company events and achievements."""

import asyncio
import logging
import re
from datetime import datetime
from typing import List, Optional, Dict, Any

from .models import Milestone
from config import settings

logger = logging.getLogger(__name__)

CATEGORY_KEYWORDS = {
    "foundation": ["founded", "established", "incorporated", "started", "created", "born"],
    "growth": ["growth", "revenue", "profit", "expanded", "scaled", "increased", "million", "billion"],
    "expansion": ["expansion", "global", "international", "market entry", "new market", "opened"],
    "recognition": ["award", "recognized", "ranked", "featured", "certified", "accredited"],
    "leadership": ["ceo", "cto", "cfo", "appointed", "leadership", "executive", "board", "founder"],
    "product": ["product", "launch", "released", "unveiled", "announced", "service", "feature"],
    "funding": ["funding", "raised", "investment", "series", "venture", "round", "capital"],
}


async def scrape_milestones_serper(company_name: str) -> List[Dict[str, Any]]:
    """Scrape company milestones using Serper.dev API - optimized with parallel queries."""
    if not settings.serper_api_key:
        return []

    milestones = []
    search_queries = [
        f"{company_name} company history milestones achievements",
        f"{company_name} funding investment news 2024 2025",
    ]

    headers = {
        "X-API-KEY": settings.serper_api_key,
        "Content-Type": "application/json"
    }

    async def fetch_query(client: httpx.AsyncClient, query: str) -> List[Dict[str, Any]]:
        try:
            payload = {"q": query, "num": 8}
            response = await client.post(
                "https://google.serper.dev/search",
                json=payload,
                headers=headers,
                timeout=5.0
            )
            response.raise_for_status()
            data = response.json()
            results = []

            for result in data.get("organic", [])[:8]:
                snippet = result.get("snippet", "")
                link = result.get("link", "")
                title = result.get("title", "")

                if snippet and len(snippet) > 30:
                    category = _categorize_text(snippet, title)
                    year = _extract_year(snippet + " " + title)

                    results.append({
                        "title": title[:120] if title else "Company Milestone",
                        "description": snippet[:400],
                        "year": year,
                        "category": category,
                        "source_url": link,
                        "source_name": _extract_domain(link),
                        "is_verified": len(link) > 0,
                    })
            return results
        except Exception as e:
            logger.warning(f"Serper query failed: {e}")
            return []

    try:
        async with httpx.AsyncClient() as client:
            tasks = [fetch_query(client, q) for q in search_queries]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for result in results:
                if isinstance(result, list):
                    milestones.extend(result)

    except Exception as e:
        logger.warning(f"Serper milestone scraping failed: {e}")

    return _deduplicate_milestones(milestones)


async def scrape_milestones_duckduckgo(company_name: str) -> List[Dict[str, Any]]:
    """Scrape company milestones using DuckDuckGo - optimized single query."""
    milestones = []

    try:
        from duckduckgo_search import DDGS
        ddg = DDGS()

        query = f"{company_name} company milestones achievements news"
        results = list(ddg.text(query, max_results=8))

        for result in results[:8]:
            body = result.get("body", "")
            href = result.get("href", "")
            title = result.get("title", "")

            if body and len(body) > 30:
                category = _categorize_text(body, title)
                year = _extract_year(body + " " + title)

                milestones.append({
                    "title": title[:120] if title else "Company Milestone",
                    "description": body[:400],
                    "year": year,
                    "category": category,
                    "source_url": href,
                    "source_name": _extract_domain(href),
                    "is_verified": len(href) > 0,
                })

    except Exception as e:
        logger.warning(f"DuckDuckGo milestone scraping failed: {e}")

    return _deduplicate_milestones(milestones)


def _categorize_text(text: str, title: str) -> str:
    """Categorize milestone based on text content."""
    combined = (text + " " + title).lower()

    scores = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in combined)
        scores[category] = score

    if max(scores.values()) > 0:
        return max(scores, key=scores.get)
    return "growth"


def _extract_year(text: str) -> str:
    """Extract year from text."""
    year_patterns = [
        r'\b(19\d{2}|20\d{2})\b',
        r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b',
        r'\bQ[1-4]\s+(\d{4})\b',
    ]

    for pattern in year_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            match = matches[0]
            if isinstance(match, tuple):
                for m in match:
                    if re.match(r'^\d{4}$', m):
                        year = int(m)
                        if 2000 <= year <= 2030:
                            return m
            elif re.match(r'^\d{4}$', str(match)):
                year = int(match)
                if 2000 <= year <= 2030:
                    return str(match)

    return datetime.utcnow().strftime("%Y")


def _extract_domain(url: str) -> str:
    """Extract domain name from URL."""
    if not url:
        return "Web Source"
    try:
        from urllib.parse import urlparse
        domain = urlparse(url).netloc
        domain = re.sub(r'^www\.', '', domain)
        return domain.split('.')[0].capitalize() if domain else "Web Source"
    except:
        return "Web Source"


def _deduplicate_milestones(milestones: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Remove duplicate or highly similar milestones."""
    if not milestones:
        return []

    unique = []
    seen_descriptions = []

    for m in milestones:
        desc_lower = m["description"].lower()[:80]

        is_duplicate = False
        for seen in seen_descriptions:
            if _jaccard_similarity(desc_lower, seen) > 0.6:
                is_duplicate = True
                break

        if not is_duplicate:
            unique.append(m)
            seen_descriptions.append(desc_lower)

    unique.sort(key=lambda x: x.get("year", "0"), reverse=True)
    return unique[:7]


def _jaccard_similarity(s1: str, s2: str) -> float:
    """Calculate Jaccard similarity between two strings."""
    set1 = set(s1.split())
    set2 = set(s2.split())
    intersection = len(set1 & set2)
    union = len(set1 | set2)
    return intersection / union if union > 0 else 0


async def fetch_company_milestones(company_name: str) -> List[Milestone]:
    """
    Fetch real company milestones from multiple sources with aggressive timeouts.

    Returns max 7 Milestone objects sorted by year (most recent first).
    """
    all_milestones: List[Dict[str, Any]] = []

    try:
        serper_task = asyncio.create_task(scrape_milestones_serper(company_name))
        ddg_task = asyncio.create_task(scrape_milestones_duckduckgo(company_name))

        done, pending = await asyncio.wait(
            [serper_task, ddg_task],
            timeout=8.0
        )

        for task in pending:
            task.cancel()
            logger.info("Milestone scraping task cancelled due to timeout")

        for task in done:
            try:
                result = task.result()
                if result:
                    all_milestones.extend(result)
            except Exception as e:
                logger.warning(f"Task result error: {e}")

    except Exception as e:
        logger.warning(f"Milestone fetch failed: {e}")

    deduped = _deduplicate_milestones(all_milestones)

    milestones = []
    for m in deduped[:7]:
        try:
            milestone = Milestone(
                year=m.get("year", datetime.utcnow().strftime("%Y")),
                title=m.get("title", "Company Milestone"),
                description=m.get("description", ""),
                category=m.get("category", "growth"),
                source_url=m.get("source_url"),
                source_name=m.get("source_name"),
                fetched_at=datetime.utcnow(),
                is_verified=m.get("is_verified", False),
            )
            milestones.append(milestone)
        except Exception as e:
            logger.warning(f"Failed to create Milestone: {e}")

    return milestones
