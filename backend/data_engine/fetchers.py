"""Async data fetchers for real financial and registry information."""

import asyncio
import logging
import re
import functools
from typing import Any, Dict, List, Optional

import yfinance as yf
import httpx
from config import settings

logger = logging.getLogger(__name__)

# ─── Ticker Symbol Resolution ───────────────────────────────────────
# Maps well-known company names to Yahoo Finance tickers.
# For unlisted companies, yfinance search is attempted.
_KNOWN_TICKERS: Dict[str, str] = {
    "apple": "AAPL",
    "google": "GOOGL",
    "alphabet": "GOOGL",
    "microsoft": "MSFT",
    "amazon": "AMZN",
    "tesla": "TSLA",
    "meta": "META",
    "facebook": "META",
    "nvidia": "NVDA",
    "netflix": "NFLX",
    "adobe": "ADBE",
    "salesforce": "CRM",
    "paypal": "PYPL",
    "intel": "INTC",
    "amd": "AMD",
    "ibm": "IBM",
    "oracle": "ORCL",
    "uber": "UBER",
    "airbnb": "ABNB",
    "spotify": "SPOT",
    "snap": "SNAP",
    "snapchat": "SNAP",
    "twitter": "TWTR",
    "x": "TWTR",
    "walmart": "WMT",
    "coca-cola": "KO",
    "coca cola": "KO",
    "pepsi": "PEP",
    "pepsico": "PEP",
    "nike": "NKE",
    "disney": "DIS",
    "boeing": "BA",
    "jpmorgan": "JPM",
    "jp morgan": "JPM",
    "goldman sachs": "GS",
    "visa": "V",
    "mastercard": "MA",
    "johnson & johnson": "JNJ",
    "procter & gamble": "PG",
    "chevron": "CVX",
    "exxon": "XOM",
    "exxonmobil": "XOM",
    "berkshire hathaway": "BRK-B",
    "samsung": "005930.KS",
    "sony": "SONY",
    "toyota": "TM",
    "tata": "TCS.NS",
    "reliance": "RELIANCE.NS",
    "infosys": "INFY",
    "wipro": "WIT",
    "hdfc": "HDFCBANK.NS",
    "icici": "ICICIBANK.NS",
    "colgate": "CL",
    "palmolive": "CL",
    "unilever": "UL",
    "nestle": "NESTLEIND.NS",
}


@functools.lru_cache(maxsize=100)
def _get_ticker_sync(query: str) -> Optional[str]:
    """Synchronous ticker lookup for caching."""
    try:
        ticker = yf.Ticker(query)
        info = ticker.info
        return info.get("symbol")
    except:
        return None


async def _resolve_ticker(company_name: str) -> Optional[str]:
    """Resolve a company name to a Yahoo Finance ticker symbol.

    Checks the hardcoded map first, then tries yfinance search.
    """
    key = company_name.strip().lower()

    # Direct match
    if key in _KNOWN_TICKERS:
        return _KNOWN_TICKERS[key]

    # If it looks like a ticker already (all caps, short), use it directly
    if company_name.isupper() and len(company_name) <= 6 and company_name.isalpha():
        return company_name

    # Try yfinance search with parallel exchange checks
    try:
        search_queries = [company_name]
        if not re.search(r'\.(NS|BO)$', company_name, re.I):
            search_queries.extend([f"{company_name}.NS", f"{company_name}.BO"])

        # Run checks in parallel with a timeout
        tasks = [asyncio.to_thread(_get_ticker_sync, q) for q in search_queries]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for res in results:
            if isinstance(res, str) and res:
                return res
    except Exception as e:
        logger.warning(f"Ticker resolution failed for {company_name}: {e}")

    # Try partial match in known tickers
    for name, ticker in _KNOWN_TICKERS.items():
        if key in name or name in key:
            return ticker

    return None


async def get_financials(ticker_or_name: str) -> List[Dict[str, Any]]:
    """Fetch REAL historical revenue data via yfinance.

    Resolves company names to ticker symbols, then fetches actual
    income statements from Yahoo Finance.

    Parameters
    ----------
    ticker_or_name:
        Yahoo Finance ticker symbol or company name.

    Returns
    -------
    List[Dict[str, Any]]
        List of ``{"year": int, "revenue": float, "note": str}`` dictionaries.
    """
    # Resolve ticker
    ticker_symbol = await _resolve_ticker(ticker_or_name)

    if not ticker_symbol:
        logger.warning(
            "Could not resolve ticker for '%s'. Company may be private/unlisted.",
            ticker_or_name,
        )
        return _private_company_response(ticker_or_name)

    logger.info("Resolved '%s' → ticker '%s'", ticker_or_name, ticker_symbol)

    try:
        ticker = await asyncio.to_thread(yf.Ticker, ticker_symbol)
        income_stmt = await asyncio.to_thread(lambda: ticker.income_stmt)

        if income_stmt is None or income_stmt.empty:
            raise ValueError("No income statement available.")

        # Try "Total Revenue" first, fall back to other labels
        revenue_row = None
        for label in ["Total Revenue", "Operating Revenue", "Revenue"]:
            if label in income_stmt.index:
                revenue_row = income_stmt.loc[label]
                break

        if revenue_row is None:
            raise ValueError("Revenue row not found in income statement.")

        records: List[Dict[str, Any]] = []
        for date, value in revenue_row.items():
            year = int(date.year)
            revenue = float(value) if value is not None else 0.0
            records.append({
                "year": year,
                "revenue": revenue,
                "note": f"Source: Yahoo Finance ({ticker_symbol})"
            })

        records.sort(key=lambda d: d["year"], reverse=True)
        logger.info(
            "Fetched %d years of revenue data for '%s' (%s)",
            len(records), ticker_or_name, ticker_symbol
        )
        return records

    except Exception as exc:
        logger.warning(
            "yfinance income_stmt failed for '%s' (%s): %s. Trying quarterly...",
            ticker_or_name, ticker_symbol, exc,
        )

        # Fall back to quarterly financials and annualize
        try:
            ticker = await asyncio.to_thread(yf.Ticker, ticker_symbol)
            q_income = await asyncio.to_thread(lambda: ticker.quarterly_income_stmt)

            if q_income is not None and not q_income.empty:
                revenue_row = None
                for label in ["Total Revenue", "Operating Revenue", "Revenue"]:
                    if label in q_income.index:
                        revenue_row = q_income.loc[label]
                        break

                if revenue_row is not None:
                    yearly: Dict[int, float] = {}
                    for date, value in revenue_row.items():
                        yr = int(date.year)
                        rev = float(value) if value is not None else 0.0
                        yearly[yr] = yearly.get(yr, 0) + rev

                    records = [
                        {"year": yr, "revenue": rev, "note": f"Annualized from quarterly ({ticker_symbol})"}
                        for yr, rev in sorted(yearly.items(), reverse=True)
                    ]
                    if records:
                        return records

        except Exception as q_exc:
            logger.warning("Quarterly fallback also failed: %s", q_exc)

        return _private_company_response(ticker_or_name)


def _private_company_response(company_name: str) -> List[Dict[str, Any]]:
    """Return an empty list with a note for private/unlisted companies."""
    return [{
        "year": 2024,
        "revenue": 0,
        "note": f"'{company_name}' is not publicly listed. Financial data unavailable."
    }]


async def get_registry_data(company_name: str) -> Dict[str, Any]:
    """Fetch real company information using yfinance and web search.

    Returns actual company metadata (industry, sector, country, etc.)
    instead of hardcoded mock data.

    Parameters
    ----------
    company_name:
        The name of the company to query.

    Returns
    -------
    Dict[str, Any]
        Registry data with real company information.
    """
    logger.info("Fetching registry data for '%s'", company_name)

    result: Dict[str, Any] = {
        "company_name": company_name,
        "registration_date": None,
        "status": "unknown",
        "jurisdiction": None,
        "industry": None,
        "sector": None,
        "website": None,
        "description": None,
        "employees": None,
        "market_cap": None,
        "country": None,
        "ceo": None,
    }

    # Try yfinance for company info
    ticker_symbol = await _resolve_ticker(company_name)

    if ticker_symbol:
        try:
            # Use a timeout for yfinance calls
            ticker = await asyncio.to_thread(yf.Ticker, ticker_symbol)
            info = await asyncio.wait_for(asyncio.to_thread(lambda: ticker.info), timeout=5.0)

            if info:
                result["company_name"] = info.get("longName") or info.get("shortName") or company_name
                result["status"] = "active" if info.get("marketCap") else "unknown"
                result["jurisdiction"] = info.get("country", None)
                result["country"] = info.get("country", None)
                result["industry"] = info.get("industry", None)
                result["sector"] = info.get("sector", None)
                result["website"] = info.get("website", None)
                result["description"] = info.get("longBusinessSummary", None)
                result["employees"] = info.get("fullTimeEmployees", None)
                result["ceo"] = None  # yfinance doesn't reliably provide this
                result["ticker"] = ticker_symbol

                # Market cap
                mc = info.get("marketCap")
                if mc:
                    result["market_cap"] = mc
                    result["status"] = "active"

                logger.info(
                    "Got real company info for '%s': industry=%s, country=%s, employees=%s",
                    company_name,
                    result["industry"],
                    result["country"],
                    result["employees"],
                )
        except Exception as exc:
            logger.warning("yfinance info lookup failed for '%s': %s", company_name, exc)

    # If still no data, try Serper.dev and DuckDuckGo in parallel if possible
    if result["status"] == "unknown":
        tasks = []
        if settings.serper_api_key:
            tasks.append(asyncio.create_task(_fetch_serper_data(company_name)))
        
        if tasks:
            done, pending = await asyncio.wait(tasks, timeout=7.0)
            for task in done:
                serper_res = task.result()
                if serper_res:
                    result.update(serper_res)
                    result["status"] = "found"
                    break
            # Cancel pending tasks
            for task in pending:
                task.cancel()
        
        # Final fallback to DuckDuckGo if still unknown
        if result["status"] == "unknown":
            try:
                from duckduckgo_search import DDGS

                ddg = DDGS()
                # Try a more targeted search for Indian companies if context suggests it
                search_query = f"{company_name} company information India founded"
                search_results = await asyncio.to_thread(
                    lambda: list(ddg.text(search_query, max_results=5))
                )
                
                if not search_results:
                    # Fallback to general search
                    search_results = await asyncio.to_thread(
                        lambda: list(ddg.text(f"{company_name} company profile overview", max_results=3))
                    )

                if search_results:
                    # Combine snippets for context
                    snippets = " ".join(r.get("body", "") for r in search_results)
                    result["description"] = snippets[:800]
                    result["status"] = "found"
                    
                    # Try to extract website from search results
                    for r in search_results:
                        href = r.get("href", "")
                        if href and not any(x in href.lower() for x in ["duckduckgo", "facebook", "twitter", "linkedin"]):
                            result["website"] = href
                            break

            except Exception as exc:
                logger.warning("DuckDuckGo search failed for '%s': %s", company_name, exc)

    return result


async def _fetch_serper_data(company_name: str) -> Optional[Dict[str, Any]]:
    """Search for company information using Serper.dev API."""
    if not settings.serper_api_key:
        logger.warning("Serper API key is missing in settings")
        return None

    url = "https://google.serper.dev/search"
    # Enhanced query to catch corporate info specifically
    payload = {
        "q": f"{company_name} corporate profile about us founded headquarters website",
        "num": 10
    }
    headers = {
        "X-API-KEY": settings.serper_api_key,
        "Content-Type": "application/json"
    }

    try:
        logger.info(f"Querying Serper.dev for: {company_name}")
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=10.0)
            response.raise_for_status()
            search_data = response.json()

            # 1. Check Knowledge Graph first (best for famous companies like Colgate)
            kg = search_data.get("knowledgeGraph", {})
            if kg:
                description = kg.get("description", "")
                website = kg.get("website", "")
                if description:
                    logger.info(f"Found {company_name} in Knowledge Graph")
                    return {
                        "description": description,
                        "website": website,
                        "company_name": kg.get("title", company_name)
                    }

            # 2. Process organic results
            organic = search_data.get("organic", [])
            if not organic:
                logger.warning(f"Serper returned no organic results for {company_name}")
                return None

            # Extract info from snippets
            description_parts = []
            for r in organic[:5]:
                snippet = r.get("snippet", "")
                if snippet and len(snippet) > 20:
                    description_parts.append(snippet)
            
            description = " ".join(description_parts)
            
            # 3. Find official website
            website = None
            for r in organic:
                link = r.get("link", "")
                # Prioritize links that aren't social media or aggregators
                if link and not any(x in link.lower() for x in ["linkedin", "facebook", "twitter", "crunchbase", "wikipedia", "youtube", "instagram", "glassdoor", "bloomberg"]):
                    website = link
                    break
            
            if not website and organic:
                website = organic[0].get("link")

            return {
                "description": description[:2000],
                "website": website,
            }

    except Exception as e:
        logger.error(f"Serper API request failed for {company_name}: {e}")
        return None
