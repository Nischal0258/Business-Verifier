import asyncio
from crewai.tools import tool
import httpx
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS
from config import settings

# Helper for synchronous execution since CrewAI currently expects sync tools by default
def _run_async(coro):
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None
    if loop and loop.is_running():
        # If we're already in an async loop, we can't use run_until_complete.
        # But we're running CrewAI in asyncio.to_thread, so we shouldn't be here.
        import nest_asyncio
        nest_asyncio.apply()
        return asyncio.run(coro)
    return asyncio.run(coro)

@tool("CompanySearchTool")
def CompanySearchTool(company_name: str) -> str:
    """
    Search the web for general company information (industry, founding date, headquarters).
    """
    ddg = DDGS()
    query = f"{company_name} company overview headquarters industry founded"
    results = ddg.text(query, max_results=5)
    
    if not results:
        return "No company information found."
        
    extracted = []
    for r in results:
        extracted.append(f"Title: {r['title']}\nSnippet: {r['body']}")
    return "\n---\n".join(extracted)

@tool("WebsiteScraperTool")
def WebsiteScraperTool(url: str) -> str:
    """
    Scrape a company's website or about page for description and details.
    Must provide a valid URL starting with http or https.
    """
    if not url.startswith("http"):
        return "Invalid URL provided."
        
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        response = httpx.get(url, headers=headers, timeout=10.0, follow_redirects=True)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Extract text from p tags
        paragraphs = soup.find_all("p")
        text = " ".join([p.get_text().strip() for p in paragraphs if len(p.get_text().strip()) > 20])
        
        # Return first 3000 chars to avoid overwhelming the LLM context
        return text[:3000] if text else "No readable text found on website."
    except Exception as e:
        return f"Failed to scrape website: {str(e)}"

@tool("InternshipSearchTool")
def InternshipSearchTool(company_name: str) -> str:
    """
    Search job boards (Internshala, LinkedIn, Indeed) for internships and jobs at the given company.
    """
    ddg = DDGS()
    query = f"site:internshala.com OR site:linkedin.com/jobs {company_name} internship OR job hiring"
    results = ddg.text(query, max_results=5)
    
    if not results:
        return "No current internships or jobs found via job boards."
        
    extracted = []
    for r in results:
        extracted.append(f"Title: {r['title']}\nURL: {r['href']}\nSnippet: {r['body']}")
    return "\n---\n".join(extracted)

@tool("CareerPageScraperTool")
def CareerPageScraperTool(company_name: str) -> str:
    """
    Search for the company's official career page and summarize recent postings.
    """
    ddg = DDGS()
    query = f"{company_name} careers OR jobs OR 'work with us'"
    results = ddg.text(query, max_results=3)
    
    if not results:
        return "Could not find an official career page."
        
    career_links = [r['href'] for r in results if 'career' in r['href'].lower() or 'job' in r['href'].lower()]
    if not career_links:
        career_links = [results[0]['href']] # Fallback to first result
        
    return f"Likely career page URLs: {', '.join(career_links)}\nBrowse these links to find direct opportunities."

@tool("SocialMediaFinderTool")
def SocialMediaFinderTool(company_name: str) -> str:
    """
    Find social media profiles (LinkedIn, Instagram, Twitter, Facebook, YouTube) for the company.
    """
    ddg = DDGS()
    query = f"{company_name} site:linkedin.com/company OR site:instagram.com OR site:twitter.com"
    results = ddg.text(query, max_results=5)
    
    if not results:
        return "No social media presence found."
        
    profiles = []
    for r in results:
        profiles.append(f"{r['title']} - {r['href']}")
    return "\n".join(profiles)

@tool("ReviewScraperTool")
def ReviewScraperTool(company_name: str) -> str:
    """
    Search for employee and intern reviews on Glassdoor and AmbitionBox.
    """
    ddg = DDGS()
    query = f"{company_name} reviews site:glassdoor.co.in OR site:ambitionbox.com"
    results = ddg.text(query, max_results=5)
    
    if not results:
        return "No external employee reviews found."
        
    extracted = []
    for r in results:
        extracted.append(f"Source: {r['title']}\nSnippet: {r['body']}\nLink: {r['href']}")
    return "\n---\n".join(extracted)

