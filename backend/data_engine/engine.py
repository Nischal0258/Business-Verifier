"""Core data engine — parallelised web scraping, registry lookup, and LLM summarization."""

import asyncio
import logging
import os
import sys
from typing import Tuple

from .models import CompanyReport, SourceEntry, TurnoverEntry
from .fetchers import get_registry_data, get_financials
from .verification import verify_company

logger = logging.getLogger(__name__)



async def _scrape_web_sources(company_name: str) -> Tuple[str, list]:
    """Scrape public web sources for company information.

    Returns (raw_text, source_entries).
    """
    logger.info(f"Scraping web sources for '{company_name}'...")
    try:
        from duckduckgo_search import DDGS
        ddg = DDGS()
        search_query = f"{company_name} business overview history"
        search_results = await asyncio.to_thread(
            lambda: list(ddg.text(search_query, max_results=5))
        )
        if search_results:
            raw_text = "\n".join(r.get("body", "") for r in search_results)
            sources = [
                SourceEntry(url=r.get("href", ""), title=r.get("title", ""), type="web_scrape")
                for r in search_results
            ]
            return raw_text, sources
    except Exception as e:
        logger.warning(f"DuckDuckGo search scrape failed: {e}")

    # Fallback to general search URL
    raw_text = f"{company_name} is a company operating in its respective industry."
    sources = [
        SourceEntry(url=f"https://www.google.com/search?q={company_name}", title="Google Search", type="web_scrape")
    ]
    return raw_text, sources


async def _query_registry_apis(company_name: str) -> dict:
    """Query government/business registry APIs for structured data."""
    logger.info(f"Querying registry APIs for '{company_name}'...")
    try:
        registry_data = await get_registry_data(company_name)
        return registry_data
    except Exception as e:
        logger.warning(f"Registry query failed: {e}")
        return {
            "company_name": company_name,
            "status": "unknown",
            "jurisdiction": None,
            "registration_date": None,
        }


async def _fetch_financial_data(company_name: str) -> dict:
    """Fetch financial/turnover data from financial APIs."""
    logger.info(f"Fetching financial data for '{company_name}'...")
    try:
        financial_data = await get_financials(company_name)
        return {"turnover_data": financial_data}
    except Exception as e:
        logger.warning(f"Financial fetch failed: {e}")
        return {"turnover_data": []}


async def generate_full_report(company_name: str) -> CompanyReport:
    """Generate a complete company verification report.

    Runs web scraping, registry lookup, and financial data fetch
    in PARALLEL, then passes raw text to LLM summarizer.

    Parameters
    ----------
    company_name:
        Raw company name from user input.

    Returns
    -------
    CompanyReport
        Complete verification report with all fields populated.
    """
    # Phase 1: Parallel data gathering (independent tasks)
    (raw_text, web_sources), registry_data, financial_data_wrapper = await asyncio.gather(
        _scrape_web_sources(company_name),
        _query_registry_apis(company_name),
        _fetch_financial_data(company_name),
    )

    financial_data = financial_data_wrapper.get("turnover_data", [])

    # Run verification scoring algorithm
    is_verified, verification_score = verify_company(registry_data, financial_data)

    # Compile rich context for LLM summarizer
    company_description = registry_data.get("description")
    combined_context = f"{raw_text}\n\nDescription: {company_description}" if company_description else raw_text

    # Phase 2: LLM summarization (depends on gathered context from Phase 1)
    is_mock = False
    try:
        from .summarizer import summarize_history
        summary, is_mock = await summarize_history(combined_context)
    except Exception as e:
        logger.warning(f"Summarizer not available: {e}. Using raw text fallback.")
        summary = raw_text[:800]

    # Convert turnover data to TurnoverEntry list
    turnover_entries = []
    for entry in financial_data:
        turnover_entries.append(
            TurnoverEntry(
                year=str(entry.get("year", "")),
                amount=float(entry.get("revenue") or 0.0),
                currency="INR" if ".NS" in registry_data.get("company_name", "") or "INR" in str(entry.get("note", "")) else "USD"
            )
        )

    # Build report matching models.py CompanyReport
    report = CompanyReport(
        company_name=registry_data.get("company_name") or company_name,
        is_verified=is_verified,
        verification_score=float(verification_score),
        company_history=summary,
        jurisdiction=registry_data.get("jurisdiction") or registry_data.get("country"),
        incorporation_date=registry_data.get("registration_date"),
        turnover_data=turnover_entries,
        sources=web_sources,
    )

    # Attach mock flag for downstream transparency
    report._is_mock = is_mock

    logger.info(
        f"Report generated for '{report.company_name}': "
        f"verified={report.is_verified}, score={report.verification_score}, "
        f"mock={is_mock}, sources={len(web_sources)}"
    )

    return report

