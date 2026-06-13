import asyncio
from crewai import Agent, Task, Crew, Process, LLM
from config import settings
from agents.tools import (
    CompanySearchTool,
    InternshipSearchTool,
    SocialMediaFinderTool,
    ReviewScraperTool,
    WebsiteScraperTool,
    CareerPageScraperTool
)

def build_student_report_crew(company_name: str) -> Crew:
    """Build a crew of AI agents to research a company for students."""
    
    # --- LLM CONFIGURATION (Nvidia & Groq) ---
    nvidia_llm = LLM(
        model="nvidia_nim/meta/llama-3.1-70b-instruct", 
        api_key=settings.nvidia_api_key,
        base_url="https://integrate.api.nvidia.com/v1"
    )
    fast_llm = LLM(model="groq/llama-3.1-8b-instant", api_key=settings.groq_api_key)
    
    # --- AGENT DEFINITIONS ---
    manager_agent = Agent(
        role="Chief Student Intelligence Director",
        goal="Coordinate the research team and ensure a perfect, student-focused JSON output.",
        backstory="""You are a meticulous Project Manager and former University Placement Director. 
        You delegate tasks, critically review your team's findings, reject hallucinations, 
        and ensure the final report is perfect.""",
        llm=nvidia_llm,
        allow_delegation=True,
        verbose=True
    )
    
    company_scout = Agent(
        role="Company Research Analyst",
        goal=f"Find comprehensive information about {company_name}",
        backstory="""You are an expert corporate researcher. You find company details
        including founding date, industry, employee count, website, founders, and
        headquarters. You focus on facts, not financial revenue.""",
        llm=nvidia_llm,
        tools=[CompanySearchTool(), WebsiteScraperTool()],
        verbose=True,
        max_iter=5
    )
    
    opportunity_hunter = Agent(
        role="Internship & Job Opportunity Finder",
        goal=f"Find ALL available internships and jobs at {company_name}",
        backstory="""You specialize in finding internship and job opportunities.
        You search Internshala, LinkedIn Jobs, Indeed, Naukri, company career pages,
        and Google Jobs. You extract title, location, stipend, duration, and apply links.
        You are especially good at finding opportunities at small/local companies.""",
        llm=fast_llm,
        tools=[InternshipSearchTool(), CareerPageScraperTool()],
        verbose=True,
        max_iter=5
    )
    
    social_media_detective = Agent(
        role="Social Media & Digital Presence Analyst",
        goal=f"Find all social media profiles and digital presence of {company_name}",
        backstory="""You find company social media profiles on LinkedIn, Instagram,
        Twitter/X, Facebook, and YouTube. You extract profile URLs, follower counts,
        and recent activity. For small companies that don't have websites, their
        social media IS their presence — and you find it.""",
        llm=nvidia_llm,
        tools=[SocialMediaFinderTool()],
        verbose=True,
        max_iter=4
    )
    
    review_analyst = Agent(
        role="Employee Review & Culture Analyst",
        goal=f"Analyze employee reviews and work culture at {company_name}",
        backstory="""You analyze company reviews from Glassdoor, AmbitionBox, and
        social media comments. You identify patterns in work-life balance, learning
        opportunities, management quality, and intern experiences. You write a
        brief 'Student Verdict' summarizing whether this is a good place to intern.""",
        llm=nvidia_llm,
        tools=[ReviewScraperTool()],
        verbose=True,
        max_iter=4
    )
    
    trust_evaluator = Agent(
        role="Student Trust Score Evaluator",
        goal=f"Calculate a Student Trust Score for {company_name}",
        backstory="""You evaluate companies from a STUDENT's perspective. You don't
        care about revenue size — you care about: Is this company growing? Are they
        actively hiring? Do employees like working there? Do they have a professional
        web presence? Are they intern-friendly? You score companies 0-100 and
        classify them as 'Established', 'Rising Star', 'Emerging', or 'Unknown'.""",
        llm=nvidia_llm,
        tools=[],  # Works on data from other agents
        verbose=True,
        max_iter=3
    )
    
    # --- TASK DEFINITIONS ---
    research_task = Task(
        description=f"""Research the company '{company_name}'. Find:
        1. Official name, industry, sector, founding date
        2. Website URL, employee count
        3. Founder/CEO names
        4. Headquarters location
        5. Brief company description (2-3 sentences)
        Do NOT focus on financial revenue — students don't care about that.""",
        expected_output="""JSON with keys: company_name, industry, sector, founded,
        website, employee_count, founders, headquarters, description""",
        agent=company_scout,
        output_json=dict
    )
    
    opportunity_task = Task(
        description=f"""Find ALL internship and job opportunities at '{company_name}'.
        Search across: Internshala, LinkedIn Jobs, Indeed, Naukri, Google Jobs,
        and the company's own career page (if they have a website).
        For each opportunity, extract: title, location, type (internship/full_time),
        stipend/salary, duration, required skills, and apply URL.
        Even if no formal listings exist, check if the company mentions hiring
        on their social media or website.""",
        expected_output="""JSON list of opportunities, each with:
        title, location, type, stipend, duration, skills, apply_url, source""",
        agent=opportunity_hunter,
        context=[research_task],  # Needs company website from scout
        output_json=list
    )
    
    social_task = Task(
        description=f"""Find all social media profiles for '{company_name}'.
        Search for their profiles on:
        1. LinkedIn (company page URL)
        2. Instagram (business page URL)
        3. Twitter/X (profile URL)
        4. Facebook (business page URL)
        5. YouTube (channel URL, if any)
        Also note: follower counts, last post date (if visible), and whether
        the page looks active or abandoned.""",
        expected_output="""JSON with keys: linkedin_url, instagram_url, twitter_url,
        facebook_url, youtube_url, social_presence_score (1-10),
        active_platforms (list of active platform names)""",
        agent=social_media_detective,
        output_json=dict
    )
    
    review_task = Task(
        description=f"""Analyze employee reviews for '{company_name}'.
        Search Glassdoor and AmbitionBox for reviews. Extract:
        1. Overall rating, work-life balance, career growth, salary ratings
        2. Total review count
        3. Top 3 pros and top 3 cons mentioned by employees
        4. Whether interns/freshers have specifically left reviews
        Then write a 2-sentence 'Student Verdict' summarizing whether
        this is a good company for students to intern/work at.""",
        expected_output="""JSON with: overall_rating, work_life_balance,
        career_growth, review_count, top_pros, top_cons, student_verdict""",
        agent=review_analyst,
        output_json=dict
    )
    
    scoring_task = Task(
        description=f"""Based on all the research gathered about '{company_name}',
        calculate a Student Trust Score (0-100) using these criteria:
        - Hiring Activity (0-25): Are they actively posting jobs/internships?
        - Employee Reviews (0-20): Do employees rate them well?
        - Social Media Presence (0-15): Active LinkedIn/Instagram/Twitter?
        - Company Legitimacy (0-15): Website, description, industry data?
        - Intern Friendliness (0-15): Do they hire interns? Mention freshers?
        - Growth Signals (0-10): Growing team, new offices, recent funding?
        
        Classify as: 'established' (80+), 'rising_star' (60-79),
        'emerging' (40-59), or 'unknown' (<40).""",
        expected_output="""JSON with: score (int), classification (string),
        breakdown (dict of the 6 criteria scores), summary (string)""",
        agent=trust_evaluator,
        context=[research_task, opportunity_task, social_task, review_task],
        output_json=dict
    )
    
    # --- CREW ASSEMBLY ---
    crew = Crew(
        agents=[company_scout, opportunity_hunter, social_media_detective,
                review_analyst, trust_evaluator],
        tasks=[research_task, opportunity_task, social_task,
               review_task, scoring_task],
        manager_agent=manager_agent,
        process=Process.hierarchical,
        verbose=True,
        memory=False,
    )
    
    return crew


def build_comparator_crew(companies: list[str]) -> Crew:
    """Build a crew to compare multiple companies."""
    
    nvidia_llm = LLM(
        model="nvidia_nim/meta/llama-3.1-70b-instruct", 
        api_key=settings.nvidia_api_key,
        base_url="https://integrate.api.nvidia.com/v1"
    )
    
    manager_agent = Agent(
        role="Chief Comparison Director",
        goal="Coordinate the comparison team and ensure a balanced, fair comparison of companies.",
        backstory="You are an expert at evaluating multiple companies and highlighting their pros and cons side-by-side.",
        llm=nvidia_llm,
        allow_delegation=True,
        verbose=True
    )
    
    comparator_analyst = Agent(
        role="Comparator Analyst",
        goal=f"Compare these companies: {', '.join(companies)}",
        backstory="""You evaluate multiple companies simultaneously, comparing their 
        work culture, growth, opportunities, and overall student-friendliness. 
        You highlight which company is better based on specific criteria.""",
        llm=nvidia_llm,
        tools=[CompanySearchTool(), ReviewScraperTool()],
        verbose=True,
        max_iter=5
    )
    
    comparison_task = Task(
        description=f"""Research and compare the following companies: {', '.join(companies)}.
        For each company, find their industry, employee reviews, and general reputation.
        Create a side-by-side comparison highlighting:
        1. Best for Work-Life Balance
        2. Best for Career Growth
        3. Overall Winner for Students
        Provide clear reasoning for your choices.""",
        expected_output="""JSON with keys: 
        companies_compared (list of objects with company details), 
        winners (dict mapping categories like 'work_life_balance', 'career_growth', 'overall' to company names),
        reasoning (detailed text explaining the comparison)""",
        agent=comparator_analyst,
        output_json=dict
    )
    
    crew = Crew(
        agents=[comparator_analyst],
        tasks=[comparison_task],
        manager_agent=manager_agent,
        process=Process.hierarchical,
        verbose=True,
        memory=False,
    )
    
    return crew
