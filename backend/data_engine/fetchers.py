"""Async data fetchers for real financial and registry information."""

import asyncio
import logging
import re
from typing import Any, Dict, List, Optional

import yfinance as yf
import httpx

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
}


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

    # Try yfinance search
    try:
        search_result = await asyncio.to_thread(
            lambda: yf.Ticker(company_name).info
        )
        if search_result and search_result.get("symbol"):
            return search_result["symbol"]
    except Exception:
        pass

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
            ticker = await asyncio.to_thread(yf.Ticker, ticker_symbol)
            info = await asyncio.to_thread(lambda: ticker.info)

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

    # If still no data, try DuckDuckGo search for basic info
    if result["status"] == "unknown":
        try:
            from duckduckgo_search import DDGS

            ddg = DDGS()
            search_results = await asyncio.to_thread(
                lambda: list(ddg.text(f"{company_name} company information founded", max_results=3))
            )
            if search_results:
                # Combine snippets for context
                snippets = " ".join(r.get("body", "") for r in search_results)
                result["description"] = snippets[:500]
                result["status"] = "found"  # We found info even if not on stock exchange

        except Exception as exc:
            logger.warning("DuckDuckGo search failed for '%s': %s", company_name, exc)

    return result
