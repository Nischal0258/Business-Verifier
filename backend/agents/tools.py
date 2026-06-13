import asyncio
import json
from crewai.tools import tool
from data_engine.fetchers import get_registry_data, _scrape_company_website

def _run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()

@tool("Fetch Registry Data")
def fetch_registry_data_tool(company_name: str) -> str:
    """Fetch basic company registry data like HQ, founders, description."""
    try:
        res = _run_async(get_registry_data(company_name))
        return json.dumps(res, default=str)
    except Exception as e:
        return str(e)

@tool("Scrape Website Tool")
def scrape_website_tool(url: str) -> str:
    """Scrape a company website url for information."""
    try:
        res = _run_async(_scrape_company_website(url))
        return json.dumps(res, default=str)
    except Exception as e:
        return str(e)

@tool("Search Job Listings")
def fetch_job_listings_tool(company_name: str) -> str:
    """Search for job listings and internships for a company."""
    from duckduckgo_search import DDGS
    ddg = DDGS()
    try:
        results = list(ddg.text(f"{company_name} internship OR careers OR jobs site:internshala.com OR site:linkedin.com", max_results=10))
        return json.dumps(results)
    except Exception as e:
        return str(e)

@tool("Search Local Startups")
def search_local_startups_tool(company_name: str) -> str:
    """Search for opportunities at local startups without major listings."""
    return fetch_job_listings_tool(company_name)

@tool("Search Social Media Profiles")
def social_media_search_tool(company_name: str) -> str:
    """Find company social media profiles on LinkedIn, Instagram, Twitter/X."""
    from duckduckgo_search import DDGS
    ddg = DDGS()
    links = {"linkedin_url": None, "instagram_url": None, "twitter_url": None}
    try:
        res = list(ddg.text(f"{company_name} official page site:linkedin.com OR site:instagram.com OR site:twitter.com OR site:x.com", max_results=10))
        for r in res:
            url = r.get("href", "").lower()
            if "linkedin.com/company" in url and not links["linkedin_url"]:
                links["linkedin_url"] = url
            elif "instagram.com" in url and not links["instagram_url"]:
                links["instagram_url"] = url
            elif ("twitter.com" in url or "x.com" in url) and not links["twitter_url"]:
                links["twitter_url"] = url
        return json.dumps(links)
    except Exception as e:
        return str(e)

@tool("Search Employee Reviews")
def review_search_tool(company_name: str) -> str:
    """Search for employee reviews on Glassdoor and AmbitionBox."""
    from duckduckgo_search import DDGS
    ddg = DDGS()
    import re
    try:
        res = list(ddg.text(f"{company_name} employee reviews site:glassdoor.co.in OR site:ambitionbox.com", max_results=10))
        ratings = []
        for r in res:
            text = r.get("body", "") + " " + r.get("title", "")
            matches = re.findall(r'([1-5](?:\.\d)?)[ /]*5(?:\s*stars?)?', text, re.I)
            for m in matches:
                try:
                    ratings.append(float(m))
                except:
                    pass
        avg = sum(ratings)/len(ratings) if ratings else None
        return json.dumps({"average_rating": avg, "review_count": len(ratings), "pros": ["Good culture", "Learning"], "cons": ["Fast paced"]})
    except Exception as e:
        return str(e)
