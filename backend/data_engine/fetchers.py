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
    """Fetch historical revenue data with fallback chain.

    Order: Serper → DuckDuckGo → yfinance → Alpha Vantage → Finnhub

    Returns
    -------
    List[Dict[str, Any]]
        List of ``{"year": int, "revenue": float, "note": str}`` dictionaries.
    """
    company_name = ticker_or_name.strip()

    sources = [
        ("Serper", _fetch_financials_serper),
        ("DuckDuckGo", _fetch_financials_duckduckgo),
        ("yfinance", _fetch_financials_yfinance),
        ("Alpha Vantage", _fetch_financials_alpha_vantage),
        ("Finnhub", _fetch_financials_finnhub),
    ]

    for source_name, fetcher_func in sources:
        try:
            result = await fetcher_func(company_name)
            if result:
                logger.info(
                    "Financial data fetched for '%s' via %s: %d records",
                    company_name, source_name, len(result)
                )
                return result
        except Exception as exc:
            logger.warning("%s failed for '%s': %s", source_name, company_name, exc)

    logger.warning("All financial data sources exhausted for '%s'. Returning private company response.", company_name)
    return _private_company_response(company_name)


async def _fetch_financials_serper(company_name: str) -> Optional[List[Dict[str, Any]]]:
    """Fetch financial data from Serper.dev search API."""
    if not settings.serper_api_key:
        return None

    url = "https://google.serper.dev/search"
    payload = {
        "q": f"{company_name} annual revenue income financial results {2024} {2023}",
        "num": 10
    }
    headers = {
        "X-API-KEY": settings.serper_api_key,
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=10.0)
            response.raise_for_status()
            search_data = response.json()

        records = _extract_revenue_from_snippets(search_data.get("organic", []), "Serper")
        return records if records else None

    except Exception as e:
        logger.warning("Serper financials fetch failed: %s", e)
        return None


async def _fetch_financials_duckduckgo(company_name: str) -> Optional[List[Dict[str, Any]]]:
    """Fetch financial data from DuckDuckGo search."""
    try:
        from duckduckgo_search import DDGS

        ddg = DDGS()
        search_query = f"{company_name} annual revenue income statement financial results"
        search_results = await asyncio.to_thread(
            lambda: list(ddg.text(search_query, max_results=10))
        )

        if not search_results:
            return None

        records = _extract_revenue_from_snippets(search_results, "DuckDuckGo")
        return records if records else None

    except Exception as e:
        logger.warning("DuckDuckGo financials fetch failed: %s", e)
        return None


def _extract_revenue_from_snippets(results: List[Dict], source: str) -> List[Dict[str, Any]]:
    """Extract revenue figures from search snippets using regex patterns."""
    records = []
    years_found = set()

    revenue_patterns = [
        r"(?:revenue|sales|revenue of|income|turnover)\s*(?:of|data)?\s*(?:Rs\.?|USD|\$|₹|INR)?\s*([\d,.]+)\s*(?:crore|cr|million|bn|billion|trillion|tr)",
        r"(?:Rs\.?|USD|\$|₹)\s*([\d,.]+)\s*(?:crore|cr|million|bn|billion|tr)",
        r"([\d,.]+)\s*(?:crore|cr)\s*(?:revenue|sales)?",
        r"FY(\d{2,4})[:\s]+(?:Rs\.?|USD|\$|₹)?\s*([\d,.]+)",
        r"FY(\d{4})[:\s]+(?:Rs\.?|USD|\$|₹)?\s*([\d,.]+)",
    ]

    for result in results:
        snippet = result.get("snippet", "") or result.get("body", "") or ""

        for pattern in revenue_patterns:
            matches = re.finditer(pattern, snippet, re.IGNORECASE)
            for match in matches:
                try:
                    if match.lastindex == 2:
                        year_str = match.group(1)
                        value_str = match.group(2)
                        year = int(year_str) if len(year_str) == 4 else 2000 + int(year_str) if len(year_str) == 2 else None
                    else:
                        value_str = match.group(1)
                        year = None

                    if year and year not in years_found and 1990 <= year <= 2030:
                        value = _parse_revenue_value(value_str)
                        if value and value > 0:
                            records.append({
                                "year": year,
                                "revenue": value,
                                "note": f"Extracted from {source} search"
                            })
                            years_found.add(year)
                except (ValueError, AttributeError):
                    continue

    if records:
        records.sort(key=lambda d: d["year"], reverse=True)
        return records[:10]

    return None


def _parse_revenue_value(value_str: str) -> Optional[float]:
    """Parse revenue string to float, handling Indian numbering system."""
    value_str = value_str.replace(",", "").strip()

    multipliers = {
        "crore": 10_000_000,
        "cr": 10_000_000,
        "million": 1_000_000,
        "bn": 1_000_000_000,
        "billion": 1_000_000_000,
        "tr": 1_000_000_000_000,
        "trillion": 1_000_000_000_000,
    }

    for suffix, multiplier in multipliers.items():
        if suffix in value_str.lower():
            try:
                number = float(re.sub(r"[^\d.]", "", value_str.lower().replace(suffix, "")))
                return number * multiplier
            except ValueError:
                return None

    try:
        return float(value_str)
    except ValueError:
        return None


async def _fetch_financials_yfinance(company_name: str) -> Optional[List[Dict[str, Any]]]:
    """Fetch financial data from Yahoo Finance (yfinance)."""
    ticker_symbol = await _resolve_ticker(company_name)

    if not ticker_symbol:
        logger.info("Could not resolve ticker for '%s' in yfinance", company_name)
        return None

    logger.info("Attempting yfinance fetch for '%s' (ticker: %s)", company_name, ticker_symbol)

    try:
        ticker = await asyncio.to_thread(yf.Ticker, ticker_symbol)
        income_stmt = await asyncio.to_thread(lambda: ticker.income_stmt)

        if income_stmt is None or income_stmt.empty:
            raise ValueError("No income statement available.")

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
        return records if records else None

    except Exception as exc:
        logger.warning("yfinance failed for '%s': %s", company_name, exc)

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
                    return records if records else None

        except Exception as q_exc:
            logger.warning("yfinance quarterly fallback also failed: %s", q_exc)

        return None


async def _fetch_financials_alpha_vantage(company_name: str) -> Optional[List[Dict[str, Any]]]:
    """Fetch financial data from Alpha Vantage API."""
    if not settings.alpha_vantage_api_key:
        logger.info("Alpha Vantage API key not configured")
        return None

    ticker_symbol = await _resolve_ticker(company_name)
    if not ticker_symbol:
        ticker_symbol = company_name.upper().replace(" ", "")

    url = "https://www.alphavantage.co/query"
    params = {
        "function": "INCOME_STATEMENT",
        "symbol": ticker_symbol.replace(".NS", "").replace(".BO", ""),
        "apikey": settings.alpha_vantage_api_key,
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=15.0)
            response.raise_for_status()
            data = response.json()

        if "Error Message" in data or "Note" in data:
            logger.warning("Alpha Vantage error: %s", data.get("Error Message") or data.get("Note"))
            return None

        annual_reports = data.get("annualReports", [])
        if not annual_reports:
            return None

        records = []
        for report in annual_reports:
            fiscal_date = report.get("fiscalDateEnding", "")
            try:
                year = int(fiscal_date[:4])
            except (ValueError, TypeError):
                continue

            revenue = report.get("totalRevenue")
            if not revenue:
                continue

            try:
                revenue_float = float(re.sub(r"[^\d]", "", revenue))
            except (ValueError, AttributeError):
                continue

            records.append({
                "year": year,
                "revenue": revenue_float,
                "note": f"Source: Alpha Vantage ({ticker_symbol})"
            })

        records.sort(key=lambda d: d["year"], reverse=True)
        return records if records else None

    except Exception as e:
        logger.warning("Alpha Vantage fetch failed for '%s': %s", company_name, e)
        return None


async def _fetch_financials_finnhub(company_name: str) -> Optional[List[Dict[str, Any]]]:
    """Fetch financial data from Finnhub API."""
    if not settings.finnhub_api_key:
        logger.info("Finnhub API key not configured")
        return None

    ticker_symbol = await _resolve_ticker(company_name)
    if not ticker_symbol:
        ticker_symbol = company_name.upper().replace(" ", "")

    url = f"https://finnhub.io/api/v1/stock/financials"
    params = {
        "symbol": ticker_symbol.replace(".NS", "").replace(".BO", ""),
        "metric": "all",
        "token": settings.finnhub_api_key,
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=15.0)
            response.raise_for_status()
            data = response.json()

        if data.get("error") or not data.get("data"):
            logger.warning("Finnhub error: %s", data.get("error"))
            return None

        metrics = data.get("data", [])
        if not metrics:
            return None

        records = []
        for metric in metrics[:10]:
            year = metric.get("year")
            if not year:
                continue

            revenue = metric.get("revenue") or metric.get("totalRevenue")
            if not revenue:
                continue

            try:
                records.append({
                    "year": int(year),
                    "revenue": float(re.sub(r"[^\d.]", "", str(revenue))),
                    "note": f"Source: Finnhub ({ticker_symbol})"
                })
            except (ValueError, AttributeError):
                continue

        records.sort(key=lambda d: d["year"], reverse=True)
        return records if records else None

    except Exception as e:
        logger.warning("Finnhub fetch failed for '%s': %s", company_name, e)
        return None


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
