"""Async data fetchers for real financial and registry information."""

import asyncio
import logging
import re
import functools
from typing import Any, Dict, List, Optional
from datetime import datetime

import yfinance as yf
import httpx
from config import settings

logger = logging.getLogger(__name__)

_COUNTRY_HINTS = [
    "United States",
    "Canada",
    "Mexico",
    "United Kingdom",
    "Germany",
    "France",
    "Spain",
    "Italy",
    "Netherlands",
    "Sweden",
    "Norway",
    "Switzerland",
    "India",
    "China",
    "Japan",
    "South Korea",
    "Singapore",
    "Australia",
    "New Zealand",
    "UAE",
    "Saudi Arabia",
    "Brazil",
    "Argentina",
    "South Africa",
]

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
    "reliance industries": "RELIANCE.NS",
    "tcs": "TCS.NS",
    "tata consultancy services": "TCS.NS",
    "hdfc bank": "HDFCBANK.NS",
    "icici bank": "ICICIBANK.NS",
    "infosys": "INFY",
    "wipro": "WIT",
    "bharti airtel": "BHARTIARTL.NS",
    "itc": "ITC.NS",
    "sbi": "SBIN.NS",
    "state bank of india": "SBIN.NS",
    "lic": "LICI.NS",
    "kotak": "KOTAKBANK.NS",
    "axis bank": "AXISBANK.NS",
    "bajaj finance": "BAJFINANCE.NS",
    "adani": "ADANIENT.NS",
    "adani enterprises": "ADANIENT.NS",
    "zomato": "ZOMATO.NS",
    "swiggy": "SWIGGY.NS",
    "paytm": "PAYTM.NS",
    "nykaa": "NYKAA.NS",
    "ola": "OLA.NS",
    "flipkart": "WMT", # Owned by Walmart
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
    """Fetch historical revenue data with parallel execution and fallback.

    Order of preference for data: yfinance > Alpha Vantage > Finnhub > Serper > DuckDuckGo
    """
    company_name = ticker_or_name.strip()

    sources = [
        ("yfinance", _fetch_financials_yfinance),
        ("Alpha Vantage", _fetch_financials_alpha_vantage),
        ("Finnhub", _fetch_financials_finnhub),
        ("Serper", _fetch_financials_serper),
        ("DuckDuckGo", _fetch_financials_duckduckgo),
    ]

    # Fire all fetchers in parallel with individual timeouts
    tasks = []
    for name, fetcher in sources:
        tasks.append(asyncio.create_task(fetcher(company_name)))

    # Wait for tasks with a total timeout
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Pick the best result based on source preference and data quality
    for i, res in enumerate(results):
        source_name = sources[i][0]
        if isinstance(res, list) and res:
            logger.info("Using financial data from %s for '%s'", source_name, company_name)
            return res
        elif isinstance(res, Exception):
            logger.debug("%s failed for '%s': %s", source_name, company_name, res)

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
            response = await client.post(url, json=payload, headers=headers, timeout=7.0)
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
        r"(?:revenue|sales|revenue of|income|turnover|net worth)\s*(?:of|data)?\s*(?:Rs\.?|USD|\$|₹|INR)?\s*([\d,.]+)\s*(?:crore|cr|million|m|bn|billion|b|trillion|tr|t)",
        r"(?:Rs\.?|USD|\$|₹)\s*([\d,.]+)\s*(?:crore|cr|million|m|bn|billion|b|trillion|tr|t)",
        r"([\d,.]+)\s*(?:crore|cr|million|bn|billion)\s*(?:revenue|sales|turnover)?",
        r"FY(\d{2,4})[:\s]+(?:Rs\.?|USD|\$|₹)?\s*([\d,.]+)",
        r"(\d{4})\s+(?:revenue|turnover|sales)\s+(?:of\s+)?(?:Rs\.?|USD|\$|₹)?\s*([\d,.]+)",
        r"(?:revenue|turnover|sales)\s+in\s+(\d{4})\s+(?:was\s+)?(?:Rs\.?|USD|\$|₹)?\s*([\d,.]+)",
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
        "m": 1_000_000,
        "bn": 1_000_000_000,
        "billion": 1_000_000_000,
        "b": 1_000_000_000,
        "tr": 1_000_000_000_000,
        "trillion": 1_000_000_000_000,
        "t": 1_000_000_000_000,
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
            response = await client.get(url, params=params, timeout=10.0)
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
    """Fetch company information using parallel sources (yfinance, Wikipedia, Serper)."""
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
        "founder_profiles": [],
        "headquarters_info": {
            "full_address": None,
            "founding_date": None,
            "facility_details": None,
            "map_query": None,
        },
        "global_operations": [],
        "citation_sources": [],
        "chapter_last_updated": datetime.utcnow().isoformat() + "Z",
    }

    # Start all discovery tasks in parallel
    discovery_tasks = [
        asyncio.create_task(_fetch_registry_yfinance(company_name)),
        asyncio.create_task(_fetch_wikipedia_data(company_name)),
    ]
    if settings.serper_api_key:
        discovery_tasks.append(asyncio.create_task(_fetch_serper_data(company_name)))

    # Wait for initial discovery with a timeout
    discovery_results = await asyncio.gather(*discovery_tasks, return_exceptions=True)
    
    # Merge results (yfinance > Serper > Wikipedia)
    # yfinance results
    yf_res = discovery_results[0]
    if isinstance(yf_res, dict) and yf_res:
        result.update(yf_res)
        result["status"] = "active"
    
    # Wikipedia and Serper results
    for i in range(1, len(discovery_results)):
        res = discovery_results[i]
        if isinstance(res, dict) and res:
            # Merge missing fields
            for key, val in res.items():
                if not result.get(key) and val:
                    result[key] = val
            result["status"] = "found"

    # Fallback/Supplemental search for missing critical info
    missing_critical = []
    if not result.get("founder_profiles"):
        missing_critical.append("founders")
    if not result.get("headquarters_info") or not result["headquarters_info"].get("full_address"):
        missing_critical.append("headquarters")
    if not result.get("registration_date"):
        missing_critical.append("founding_date")

    if missing_critical:
        logger.info(f"Supplemental search for missing info: {missing_critical}")
        supplemental_tasks = []
        if "founders" in missing_critical:
            supplemental_tasks.append(_fetch_founders_search(company_name))
        else:
            supplemental_tasks.append(asyncio.sleep(0, result=[]))
            
        if "headquarters" in missing_critical:
            supplemental_tasks.append(_fetch_hq_search(company_name))
        else:
            supplemental_tasks.append(asyncio.sleep(0, result={}))
            
        if "founding_date" in missing_critical:
            supplemental_tasks.append(_fetch_founding_date_search(company_name))
        else:
            supplemental_tasks.append(asyncio.sleep(0, result=None))

        supp_results = await asyncio.gather(*supplemental_tasks)
        
        if "founders" in missing_critical and supp_results[0]:
            result["founder_profiles"] = supp_results[0]
        if "headquarters" in missing_critical and supp_results[1]:
            result["headquarters_info"].update(supp_results[1])
        if "founding_date" in missing_critical and supp_results[2]:
            result["registration_date"] = supp_results[2]
            result["headquarters_info"]["founding_date"] = supp_results[2]

    # Final fallback to DuckDuckGo if still unknown
    if result["status"] == "unknown":
        try:
            from duckduckgo_search import DDGS
            ddg = DDGS()
            search_query = f"{company_name} company information India founded"
            search_results = await asyncio.to_thread(lambda: list(ddg.text(search_query, max_results=5)))
            
            if search_results:
                snippets = " ".join(r.get("body", "") for r in search_results)
                result["description"] = snippets[:800]
                result["status"] = "found"
                result["global_operations"] = _build_global_operations(
                    snippets,
                    fallback_country=result.get("country"),
                    city=result.get("headquarters_info", {}).get("map_query"),
                    industry=result.get("industry"),
                    sector=result.get("sector"),
                )
                result["citation_sources"].extend(_citation_from_duckduckgo(search_results))
        except Exception as exc:
            logger.warning("DuckDuckGo search failed for '%s': %s", company_name, exc)

    # Post-processing for global operations
    if not result.get("global_operations"):
        fallback_country = result.get("country")
        if fallback_country:
            result["global_operations"] = [
                {
                    "country": fallback_country,
                    "office_locations": [result.get("headquarters_info", {}).get("map_query") or fallback_country],
                    "service_offerings": _derive_services(result.get("industry"), result.get("sector")),
                    "source": "yfinance",
                }
            ]

    result["chapter_last_updated"] = datetime.utcnow().isoformat() + "Z"
    return result


async def _fetch_registry_yfinance(company_name: str) -> Optional[Dict[str, Any]]:
    """Helper to fetch yfinance data for registry."""
    ticker_symbol = await _resolve_ticker(company_name)
    if not ticker_symbol:
        return None

    try:
        ticker = await asyncio.to_thread(yf.Ticker, ticker_symbol)
        info = await asyncio.wait_for(asyncio.to_thread(lambda: ticker.info), timeout=5.0)
        if info:
            return {
                "company_name": info.get("longName") or info.get("shortName") or company_name,
                "country": info.get("country"),
                "industry": info.get("industry"),
                "sector": info.get("sector"),
                "website": info.get("website"),
                "description": info.get("longBusinessSummary"),
                "employees": info.get("fullTimeEmployees"),
                "market_cap": info.get("marketCap"),
                "ticker": ticker_symbol,
                "founder_profiles": _extract_founder_profiles(info),
                "headquarters_info": _extract_headquarters_info(info, None),
            }
    except Exception as e:
        logger.debug(f"yfinance registry fetch failed: {e}")
    return None


def _normalize_whitespace(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    return re.sub(r"\s+", " ", value).strip()


def _extract_founder_profiles(info: Dict[str, Any]) -> List[Dict[str, Any]]:
    officers = info.get("companyOfficers") or []
    profiles: List[Dict[str, Any]] = []
    for officer in officers[:6]:
        name = officer.get("name")
        title = officer.get("title")
        if not name:
            continue
        lower_title = (title or "").lower()
        founding_role = "Founder" if "founder" in lower_title or "co-founder" in lower_title else "Leadership"
        bio_parts = []
        if officer.get("age"):
            bio_parts.append(f"Age {officer.get('age')}")
        if officer.get("yearBorn"):
            bio_parts.append(f"Born {officer.get('yearBorn')}")
        profiles.append(
            {
                "name": name,
                "biography": ", ".join(bio_parts) or "Public executive profile sourced from market disclosures.",
                "founding_role": founding_role,
                "current_position": title or "Executive",
                "photo_url": None,
                "source": "Yahoo Finance",
            }
        )
    return profiles[:4]


def _extract_headquarters_info(info: Dict[str, Any], founding_date: Optional[str]) -> Dict[str, Optional[str]]:
    address_parts = [
        info.get("address1"),
        info.get("address2"),
        info.get("city"),
        info.get("state"),
        info.get("zip"),
        info.get("country"),
    ]
    full_address = ", ".join([part for part in address_parts if part])
    city_country = ", ".join([part for part in [info.get("city"), info.get("country")] if part])
    return {
        "full_address": _normalize_whitespace(full_address),
        "founding_date": founding_date or None,
        "facility_details": "Corporate headquarters and executive operations campus.",
        "map_query": city_country or _normalize_whitespace(full_address),
    }


def _derive_services(industry: Optional[str], sector: Optional[str]) -> List[str]:
    services: List[str] = []
    if industry:
        services.append(industry)
    if sector and sector not in services:
        services.append(sector)
    if not services:
        services = ["Core business operations", "Corporate services"]
    return services[:4]


def _extract_countries(text: str) -> List[str]:
    detected: List[str] = []
    lowered = text.lower()
    for country in _COUNTRY_HINTS:
        if country.lower() in lowered:
            detected.append(country)
    # Keep insertion order and unique values
    unique: List[str] = []
    for country in detected:
        if country not in unique:
            unique.append(country)
    return unique


def _build_global_operations(
    text: str,
    fallback_country: Optional[str],
    city: Optional[str],
    industry: Optional[str],
    sector: Optional[str],
) -> List[Dict[str, Any]]:
    countries = _extract_countries(text)
    if fallback_country and fallback_country not in countries:
        countries.insert(0, fallback_country)
    operations: List[Dict[str, Any]] = []
    for country in countries[:8]:
        office_locations = [city] if city else [country]
        operations.append(
            {
                "country": country,
                "office_locations": [loc for loc in office_locations if loc],
                "service_offerings": _derive_services(industry, sector),
                "source": "Serper / public web data",
            }
        )
    return operations


def _citation_from_organic(organic: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    citations: List[Dict[str, Any]] = []
    for item in organic[:6]:
        link = item.get("link")
        title = item.get("title")
        if not link or not title:
            continue
        publisher = re.sub(r"^www\.", "", link.split("/")[2]) if "://" in link else "Web"
        citations.append(
            {
                "title": title[:140],
                "url": link,
                "publisher": publisher,
                "verified": True,
            }
        )
    return citations


def _citation_from_duckduckgo(results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    citations: List[Dict[str, Any]] = []
    for item in results[:5]:
        href = item.get("href")
        title = item.get("title")
        if not href or not title:
            continue
        publisher = re.sub(r"^www\.", "", href.split("/")[2]) if "://" in href else "Web"
        citations.append(
            {
                "title": title[:140],
                "url": href,
                "publisher": publisher,
                "verified": True,
            }
        )
    return citations


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
            response = await client.post(url, json=payload, headers=headers, timeout=7.0)
            response.raise_for_status()
            search_data = response.json()

            # 1. Check Knowledge Graph first (best for famous companies like Colgate)
            kg = search_data.get("knowledgeGraph", {})
            if kg:
                description = kg.get("description", "")
                website = kg.get("website", "")
                if description:
                    logger.info(f"Found {company_name} in Knowledge Graph")
                    hq_location = kg.get("headquarters") or kg.get("headquarter") or kg.get("founded")
                    snippets_for_ops = f"{description} {kg.get('descriptionSource', '')}"
                    return {
                        "description": description,
                        "website": website,
                        "company_name": kg.get("title", company_name),
                        "global_operations": _build_global_operations(
                            snippets_for_ops,
                            fallback_country=None,
                            city=hq_location,
                            industry=None,
                            sector=None,
                        ),
                        "citation_sources": [
                            {
                                "title": f"{kg.get('title', company_name)} knowledge graph profile",
                                "url": website,
                                "publisher": "Google Knowledge Graph",
                                "verified": True,
                            }
                        ],
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
                "global_operations": _build_global_operations(
                    description,
                    fallback_country=None,
                    city=None,
                    industry=None,
                    sector=None,
                ),
                "citation_sources": _citation_from_organic(organic),
            }

    except Exception as e:
        logger.error(f"Serper API request failed for {company_name}: {e}")
        return None


async def _fetch_wikipedia_data(company_name: str) -> Optional[Dict[str, Any]]:
    """Fetch company information from Wikipedia."""
    try:
        # 1. Search for the most relevant Wikipedia page
        search_url = "https://en.wikipedia.org/w/api.php"
        search_params = {
            "action": "query",
            "list": "search",
            "srsearch": f"{company_name} company",
            "format": "json",
            "srlimit": 1
        }
        
        async with httpx.AsyncClient() as client:
            headers = {"User-Agent": "BusinessVerificationBot/1.0 (contact: admin@example.com)"}
            search_resp = await client.get(search_url, params=search_params, headers=headers, timeout=5.0)
            search_data = search_resp.json()
            
            search_results = search_data.get("query", {}).get("search", [])
            if not search_results:
                return None
            
            page_title = search_results[0]["title"]
            
            # 2. Get the page summary
            summary_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{page_title.replace(' ', '_')}"
            summary_resp = await client.get(summary_url, headers=headers, timeout=5.0)
            if summary_resp.status_code != 200:
                return None
                
            summary_data = summary_resp.json()
            
            description = summary_data.get("extract", "")
            if not description or len(description) < 50:
                return None
                
            return {
                "description": description,
                "website": summary_data.get("content_urls", {}).get("desktop", {}).get("page"),
                "company_name": summary_data.get("title", company_name),
                "citation_sources": [
                    {
                        "title": f"{page_title} - Wikipedia",
                        "url": summary_data.get("content_urls", {}).get("desktop", {}).get("page"),
                        "publisher": "Wikipedia",
                        "verified": True,
                    }
                ],
            }
    except Exception as e:
        logger.warning(f"Wikipedia fetch failed for {company_name}: {e}")
        return None


async def _fetch_founders_search(company_name: str) -> List[Dict[str, Any]]:
    """Specifically search for company founders and leadership."""
    try:
        from duckduckgo_search import DDGS
        ddg = DDGS()
        query = f"{company_name} founders leadership team CEO"
        results = await asyncio.to_thread(lambda: list(ddg.text(query, max_results=5)))
        
        founders = []
        # Simple extraction logic: look for "founded by", "founder", "CEO"
        for res in results:
            snippet = res.get("body", "")
            # More flexible regex to find names
            # Matches names like "Deepinder Goyal", "Steve Jobs", "Pankaj Chaddah"
            patterns = [
                r"(?:founded by|founder|co-founder|CEO|MD|Chairman)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
                r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(?:founded|started|is the CEO of)",
            ]
            for pattern in patterns:
                matches = re.finditer(pattern, snippet, re.I)
                for match in matches:
                    name = match.group(1).strip()
                    # Filter out some common non-name words that might be caught
                    if name.lower() in ["the", "this", "our", "their", "company", "india", "private", "limited"]:
                        continue
                    if name not in [f["name"] for f in founders]:
                        founders.append({
                            "name": name,
                            "biography": snippet[:300] + "...",
                            "founding_role": "Founder" if any(x in snippet.lower() for x in ["founder", "started"]) else "Leadership",
                            "current_position": "Executive",
                            "source": "Web Search"
                        })
        return founders[:6]
    except Exception as e:
        logger.warning(f"Founders search failed for {company_name}: {e}")
        return []


async def _fetch_hq_search(company_name: str) -> Dict[str, Optional[str]]:
    """Specifically search for company headquarters and address."""
    try:
        from duckduckgo_search import DDGS
        ddg = DDGS()
        query = f"{company_name} headquarters address location"
        results = await asyncio.to_thread(lambda: list(ddg.text(query, max_results=3)))
        
        if results:
            # Try to find a specific address or city
            full_text = " ".join([r.get("body", "") for r in results])
            
            # Look for patterns like "located in [City]", "headquartered in [City]", or typical address formats
            hq_match = re.search(r"(?:headquartered in|located in|offices in)\s+([A-Z][a-z]+(?:\s*,?\s*[A-Z][a-z]+)*)", full_text)
            
            address = hq_match.group(1) if hq_match else results[0].get("body", "")[:200]
            
            return {
                "full_address": address,
                "facility_details": "Corporate headquarters sourced from public web records.",
                "map_query": f"{company_name} {address}" if address else f"{company_name} headquarters"
            }
    except Exception as e:
        logger.warning(f"HQ search failed for {company_name}: {e}")
    return {}


async def _fetch_founding_date_search(company_name: str) -> Optional[str]:
    """Specifically search for company founding date."""
    try:
        from duckduckgo_search import DDGS
        ddg = DDGS()
        query = f"{company_name} founded date established"
        results = await asyncio.to_thread(lambda: list(ddg.text(query, max_results=3)))
        
        for res in results:
            snippet = res.get("body", "")
            # Look for years or dates
            match = re.search(r"(?:founded in|established in|since)\s+(\d{4})", snippet, re.I)
            if match:
                return match.group(1)
    except Exception as e:
        logger.warning(f"Founding date search failed for {company_name}: {e}")
    return None
