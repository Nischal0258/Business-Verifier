"""Enhanced agent tools for internship discovery and aggregation."""

import asyncio
import logging
import json
import re
from typing import Any, Dict, List, Optional
from crewai.tools import tool

from data_engine.fetchers import (
    get_financials,
    get_registry_data,
    _scrape_company_website,
)
from data_engine.summarizer import summarize_history
from data_engine.verification import verify_company
from config import settings

logger = logging.getLogger(__name__)


# ============================================================================
# COMPANY VERIFICATION TOOLS
# ============================================================================

@tool("Fetch Company Registry Data")
def fetch_registry_data_tool(company_name: str) -> str:
    """
    Fetch comprehensive company registry data from multiple sources.

    Args:
        company_name: The name of the company to search for

    Returns:
        JSON string containing company registry information
    """
    try:
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(get_registry_data(company_name))
        return str(result)
    except Exception as e:
        logger.error(f"Registry data fetch failed for {company_name}: {e}")
        return f'{{"error": "{str(e)}"}}'


@tool("Fetch Financial Data")
def fetch_financial_data_tool(company_name: str) -> str:
    """
    Fetch financial data including revenue, profit margins, and growth metrics.

    Args:
        company_name: The name of the company to search for

    Returns:
        JSON string containing financial information
    """
    try:
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(get_financials(company_name))
        return str(result)
    except Exception as e:
        logger.error(f"Financial data fetch failed for {company_name}: {e}")
        return f'{{"error": "{str(e)}"}}'


@tool("Scrape Company Website")
def scrape_website_tool(website_url: str) -> str:
    """
    Scrape a company website for CEO, founders, and services information.

    Args:
        website_url: The URL of the company website

    Returns:
        JSON string containing scraped information
    """
    try:
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(_scrape_company_website(website_url))
        return str(result)
    except Exception as e:
        logger.error(f"Website scraping failed for {website_url}: {e}")
        return f'{{"error": "{str(e)}"}}'


@tool("Generate Company History Summary")
def generate_summary_tool(raw_context: str, company_description: str) -> str:
    """
    Generate a professional company history summary using AI.

    Args:
        raw_context: Raw context data about the company
        company_description: Initial company description

    Returns:
        Professional company history narrative
    """
    try:
        loop = asyncio.get_event_loop()
        result = loop.run_until_complete(summarize_history(raw_context, company_description))
        return result
    except Exception as e:
        logger.error(f"Summary generation failed: {e}")
        return f"Error generating summary: {str(e)}"


@tool("Verify Company Authenticity")
def verify_company_tool(registry_data: str, financial_data: str) -> str:
    """
    Verify company authenticity and calculate trust scores.

    Args:
        registry_data: JSON string of registry data
        financial_data: JSON string of financial data

    Returns:
        JSON string with verification results and trust score
    """
    try:
        reg_data = json.loads(registry_data) if isinstance(registry_data, str) else registry_data
        fin_data = json.loads(financial_data) if isinstance(financial_data, str) else financial_data

        is_verified, score = verify_company(reg_data, fin_data)
        return str({"is_verified": is_verified, "verification_score": score})
    except Exception as e:
        logger.error(f"Verification failed: {e}")
        return f'{{"error": "{str(e)}"}}'


# ============================================================================
# INTERNSHIP DISCOVERY TOOLS
# ============================================================================

@tool("Search Local Startups")
def search_local_startups_tool(location: str, industry: str = "") -> str:
    """
    Search for local startups and underrated companies in a specific location.

    Args:
        location: City or region to search
        industry: Optional industry filter

    Returns:
        JSON string containing list of local startups
    """
    try:
        from duckduckgo_search import DDGS
        ddg = DDGS()

        query = f"top startups {location}"
        if industry:
            query += f" {industry}"
        query += " internship hiring"

        loop = asyncio.get_event_loop()
        results = loop.run_until_complete(
            asyncio.to_thread(lambda: list(ddg.text(query, max_results=10)))
        )

        startups = []
        for result in results:
            title = result.get("title", "")
            startups.append({
                "name": title.split("-")[0].split("|")[0].strip() if title else "Unknown",
                "description": result.get("body", ""),
                "source": result.get("href", ""),
                "location": location
            })

        return str({"startups": startups, "count": len(startups)})
    except Exception as e:
        logger.error(f"Startup search failed for {location}: {e}")
        return f'{{"error": "{str(e)}"}}'


@tool("Aggregate Internship Listings")
def aggregate_internships_tool(query: str, location: str = "India") -> str:
    """
    Aggregate internship listings from multiple job platforms.

    Args:
        query: Search query (e.g., "software engineer intern", "marketing intern")
        location: Location to filter

    Returns:
        JSON string with aggregated internship listings
    """
    try:
        from duckduckgo_search import DDGS
        ddg = DDGS()

        search_queries = [
            f"{query} internship {location} site:naukri.com",
            f"{query} intern {location} site:linkedin.com",
            f"{query} internship startup {location}",
            f"internship {query} {location} 2024"
        ]

        all_listings = []
        loop = asyncio.get_event_loop()

        for sq in search_queries:
            try:
                results = loop.run_until_complete(
                    asyncio.to_thread(lambda: list(ddg.text(sq, max_results=5)))
                )
                for result in results:
                    if any(kw in result.get("body", "").lower() for kw in ["intern", "internship", "hiring", "apply"]):
                        all_listings.append({
                            "title": result.get("title", ""),
                            "snippet": result.get("body", ""),
                            "url": result.get("href", ""),
                            "source": "DuckDuckGo"
                        })
            except Exception:
                continue

        # Deduplicate by URL
        seen_urls = set()
        unique = []
        for listing in all_listings:
            if listing["url"] not in seen_urls:
                seen_urls.add(listing["url"])
                unique.append(listing)

        return str({"listings": unique[:20], "count": len(unique)})
    except Exception as e:
        logger.error(f"Internship aggregation failed: {e}")
        return f'{{"error": "{str(e)}"}}'


@tool("Fetch Job Listings")
def fetch_job_listings_tool(company_name: str) -> str:
    """
    Fetch job listings from a specific company.

    Args:
        company_name: Name of the company to search for jobs

    Returns:
        JSON string containing job listings
    """
    try:
        from duckduckgo_search import DDGS
        ddg = DDGS()

        query = f"{company_name} careers jobs internship careers page"

        loop = asyncio.get_event_loop()
        results = loop.run_until_complete(
            asyncio.to_thread(lambda: list(ddg.text(query, max_results=5)))
        )

        jobs = []
        for result in results:
            if any(keyword in result.get("body", "").lower() for keyword in ["hiring", "job", "career", "position", "role", "internship"]):
                jobs.append({
                    "title": result.get("title", ""),
                    "description": result.get("body", ""),
                    "source": result.get("href", ""),
                    "company": company_name
                })

        return str({"jobs": jobs, "count": len(jobs)})
    except Exception as e:
        logger.error(f"Job fetch failed for {company_name}: {e}")
        return f'{{"error": "{str(e)}"}}'


@tool("Match Student Profile")
def match_student_profile_tool(
    student_skills: str,
    academic_background: str,
    career_interests: str,
    available_opportunities: str
) -> str:
    """
    Match a student profile with relevant job opportunities.

    Args:
        student_skills: Comma-separated list of student skills
        academic_background: Student's academic background
        career_interests: Student's career interests
        available_opportunities: JSON string of available opportunities

    Returns:
        JSON string with matched opportunities and relevance scores
    """
    try:
        opportunities = json.loads(available_opportunities) if isinstance(available_opportunities, str) else available_opportunities

        if not isinstance(opportunities, list):
            opportunities = opportunities.get("opportunities", opportunities.get("jobs", opportunities.get("listings", [])))

        student_keywords = set(
            (student_skills.lower() + " " +
             academic_background.lower() + " " +
             career_interests.lower()).split()
        )

        matched = []
        for opp in opportunities:
            opp_text = str(opp).lower()
            match_score = sum(1 for keyword in student_keywords if keyword in opp_text) / max(len(student_keywords), 1)

            matched.append({
                "opportunity": opp,
                "match_score": round(match_score * 100, 2),
                "relevance": "high" if match_score > 0.5 else "medium" if match_score > 0.2 else "low"
            })

        matched.sort(key=lambda x: x["match_score"], reverse=True)

        return str({
            "matches": matched[:10],
            "total_matches": len(matched),
            "student_profile": {
                "skills": student_skills,
                "background": academic_background,
                "interests": career_interests
            }
        })
    except Exception as e:
        logger.error(f"Student matching failed: {e}")
        return f'{{"error": "{str(e)}"}}'


# ============================================================================
# SOCIAL MEDIA & REVIEW TOOLS
# ============================================================================

@tool("Find Social Media Profiles")
def find_social_profiles_tool(company_name: str) -> str:
    """
    Find official social media profiles for a company.

    Args:
        company_name: Company name to search

    Returns:
        JSON string with social media URLs (LinkedIn, Instagram, Twitter, etc.)
    """
    try:
        from duckduckgo_search import DDGS
        ddg = DDGS()

        platforms = {
            "linkedin": f"{company_name} site:linkedin.com/company",
            "instagram": f"{company_name} site:instagram.com",
            "twitter": f"{company_name} site:twitter.com OR site:x.com",
            "facebook": f"{company_name} site:facebook.com",
            "youtube": f"{company_name} site:youtube.com"
        }

        results = {}
        loop = asyncio.get_event_loop()

        for platform, query in platforms.items():
            try:
                search_results = loop.run_until_complete(
                    asyncio.to_thread(lambda: list(ddg.text(query, max_results=1)))
                )
                if search_results:
                    results[platform] = search_results[0].get("href", "")
                else:
                    results[platform] = None
            except Exception:
                results[platform] = None

        return str(results)
    except Exception as e:
        logger.error(f"Social profile search failed for {company_name}: {e}")
        return f'{{"error": "{str(e)}"}}'


@tool("Aggregate Glassdoor Reviews")
def aggregate_glassdoor_reviews_tool(company_name: str) -> str:
    """
    Aggregate employee and intern reviews from Glassdoor and similar platforms.

    Args:
        company_name: Company name to search for reviews

    Returns:
        JSON string with aggregated review data
    """
    try:
        from duckduckgo_search import DDGS
        ddg = DDGS()

        queries = [
            f"{company_name} glassdoor reviews",
            f"{company_name} glassdoor interview intern",
            f"{company_name} site:glassdoor.co.in",
            f"{company_name} site:glassdoor.com",
        ]

        all_snippets = []
        loop = asyncio.get_event_loop()

        for q in queries:
            try:
                results = loop.run_until_complete(
                    asyncio.to_thread(lambda: list(ddg.text(q, max_results=5)))
                )
                for r in results:
                    all_snippets.append({
                        "text": r.get("body", ""),
                        "url": r.get("href", ""),
                        "title": r.get("title", "")
                    })
            except Exception:
                continue

        # Extract ratings using regex
        rating_pattern = re.compile(r"(\d\.\d)\s*(?:out of|\/)\s*5", re.I)
        ratings = []
        for s in all_snippets:
            matches = rating_pattern.findall(s["text"])
            ratings.extend([float(m) for m in matches])

        avg_rating = sum(ratings) / len(ratings) if ratings else None

        return str({
            "company": company_name,
            "review_snippets": all_snippets[:10],
            "average_rating": round(avg_rating, 2) if avg_rating else None,
            "review_count": len(all_snippets)
        })
    except Exception as e:
        logger.error(f"Glassdoor aggregation failed for {company_name}: {e}")
        return f'{{"error": "{str(e)}"}}'
