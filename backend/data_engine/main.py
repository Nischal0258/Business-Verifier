"""Main async orchestrator for the Business Verification pipeline."""

import asyncio
import logging
from typing import Any, Dict, List, Tuple

from .fetchers import get_financials, get_registry_data
from .models import CompanyReport
from .summarizer import summarize_history
from .verification import verify_company
from .cache import report_cache

logger = logging.getLogger(__name__)


async def generate_full_report(company_name: str) -> CompanyReport:
    """Orchestrate the full verification pipeline for a given company.

    This function concurrently fetches registry and financial data,
    runs the verification algorithm, and synthesises a company history.
    All data is sourced from real APIs (Yahoo Finance, Serper, web search).
    """
    logger.info("Starting full report generation for '%s'", company_name)

    # 1. Check persistent cache first
    cached_report = await report_cache.get(company_name)
    if cached_report:
        return cached_report

    try:
        # 2. Fetch data in parallel
        registry_data, financial_data = await _fetch_parallel(company_name)

        real_name = registry_data.get("company_name", company_name)
        
        # 3. Parallelize Verification and Summarization
        # We can start summarization while verification is running if they don't depend on each other's output
        is_verified, verification_score = verify_company(registry_data, financial_data)
        
        raw_context = _build_raw_context(real_name, registry_data, financial_data)
        company_description = registry_data.get("description")
        
        # Summarization is often the slowest part after fetching
        company_history = await summarize_history(raw_context, company_description)

        report = CompanyReport(
            company_name=real_name,
            is_verified=is_verified,
            verification_score=verification_score,
            turnover_data=financial_data,
            company_history=company_history,
            jurisdiction=registry_data.get("jurisdiction") or registry_data.get("country"),
            incorporation_date=registry_data.get("registration_date"),
            founder_profiles=registry_data.get("founder_profiles", []),
            headquarters_info=registry_data.get("headquarters_info", {}),
            global_operations=registry_data.get("global_operations", []),
            citation_sources=registry_data.get("citation_sources", []),
            chapter_last_updated=registry_data.get("chapter_last_updated"),
            employee_count=registry_data.get("employee_count"),
            market_cap=registry_data.get("market_cap"),
        )

        # 3. Cache the result for future requests
        await report_cache.set(company_name, report)

        logger.info(
            "Completed report for '%s' (verified=%s, score=%d, revenue_years=%d)",
            real_name, is_verified, verification_score, len(financial_data)
        )
        return report

    except Exception as exc:
        logger.exception("Pipeline crashed for '%s': %s. Returning safe fallback report.", company_name, exc)
        return CompanyReport(
            company_name=company_name,
            is_verified=False,
            verification_score=0,
            turnover_data=[],
            company_history="Company history unavailable due to pipeline error.",
        )


async def _fetch_parallel(company_name: str) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """Run registry and financial fetches concurrently.

    Parameters
    ----------
    company_name:
        Company name or ticker to look up.

    Returns
    -------
    tuple
        ``(registry_data, financial_data)``
    """
    registry_task = asyncio.create_task(get_registry_data(company_name))
    financial_task = asyncio.create_task(get_financials(company_name))

    registry_data = await registry_task
    financial_data = await financial_task

    return registry_data, financial_data


def _build_raw_context(
    company_name: str,
    registry_data: Dict[str, Any],
    financial_data: List[Dict[str, Any]],
) -> str:
    """Assemble a plain-text context blob for the LLM summarizer.

    Parameters
    ----------
    company_name:
        The company identifier.
    registry_data:
        Registry metadata dictionary.
    financial_data:
        Revenue records.

    Returns
    -------
    str
        Combined context string.
    """
    lines = [
        f"Company: {company_name}",
        f"Status: {registry_data.get('status', 'unknown')}",
    ]

    if registry_data.get("country"):
        lines.append(f"Country: {registry_data['country']}")
    if registry_data.get("industry"):
        lines.append(f"Industry: {registry_data['industry']}")
    if registry_data.get("sector"):
        lines.append(f"Sector: {registry_data['sector']}")
    if registry_data.get("employees"):
        lines.append(f"Employees: {registry_data['employees']:,}")
    if registry_data.get("website"):
        lines.append(f"Website: {registry_data['website']}")
    if registry_data.get("market_cap"):
        mc = registry_data["market_cap"]
        if mc >= 1_000_000_000_000:
            lines.append(f"Market Cap: ${mc/1_000_000_000_000:.2f}T")
        elif mc >= 1_000_000_000:
            lines.append(f"Market Cap: ${mc/1_000_000_000:.2f}B")
        elif mc >= 1_000_000:
            lines.append(f"Market Cap: ${mc/1_000_000:.2f}M")
    if registry_data.get("registration_date"):
        lines.append(f"Registered: {registry_data['registration_date']}")

    if financial_data:
        lines.append("\nRevenue History:")
        for record in financial_data[:5]:
            rev = record.get("revenue", 0)
            if rev > 0:
                if rev >= 1_000_000_000:
                    lines.append(f"  {record['year']}: ${rev/1_000_000_000:.2f}B")
                elif rev >= 1_000_000:
                    lines.append(f"  {record['year']}: ${rev/1_000_000:.2f}M")
                else:
                    lines.append(f"  {record['year']}: ${rev:,.2f}")
            else:
                note = record.get("note", "No data")
                lines.append(f"  {record['year']}: {note}")
    else:
        lines.append("\nNo revenue data available (company may be private).")

    return "\n".join(lines)
