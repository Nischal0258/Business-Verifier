from crewai import Agent, Task, Crew, Process
from .config import get_llm_config
from .tools import (
    fetch_registry_data_tool, scrape_website_tool, 
    fetch_job_listings_tool, search_local_startups_tool,
    social_media_search_tool, review_search_tool
)

def build_student_report_crew(company_name: str) -> Crew:
    gemini_llm = get_llm_config("gemini")
    groq_llm = get_llm_config("groq")
    nvidia_llm = get_llm_config("nvidia")
    
    scout = Agent(
        role="Corporate Research Analyst",
        goal=f"Find official name, website, and industry for {company_name}",
        backstory="Fast, factual researcher focusing on basics.",
        llm=gemini_llm,
        tools=[fetch_registry_data_tool, scrape_website_tool]
    )
    
    hunter = Agent(
        role="Opportunity Hunter",
        goal=f"Find internships and jobs at {company_name}",
        backstory="Relentless recruiter finding hidden job postings.",
        llm=groq_llm,
        tools=[fetch_job_listings_tool, search_local_startups_tool]
    )
    
    social = Agent(
        role="Digital Presence Analyst",
        goal=f"Find social media profiles for {company_name}",
        backstory="Social media expert.",
        llm=gemini_llm,
        tools=[social_media_search_tool]
    )
    
    reviewer = Agent(
        role="Workplace Culture Analyst",
        goal=f"Analyze employee reviews for {company_name}",
        backstory="HR expert focused on intern experience.",
        llm=gemini_llm,
        tools=[review_search_tool]
    )
    
    validator = Agent(
        role="Student Trust Evaluator",
        goal="Calculate Student Trust Score based on gathered data",
        backstory="Evaluates companies entirely from a student's perspective.",
        llm=nvidia_llm
    )
    
    t1 = Task(description=f"Research basics for {company_name}", expected_output="Company basics JSON", agent=scout)
    t2 = Task(description=f"Find jobs at {company_name}", expected_output="List of jobs JSON", agent=hunter)
    t3 = Task(description=f"Find social profiles for {company_name}", expected_output="Social URLs JSON", agent=social)
    t4 = Task(description=f"Analyze reviews for {company_name}", expected_output="Reviews JSON", agent=reviewer)
    t5 = Task(description="Calculate 0-100 Trust Score", expected_output="Trust Score JSON", agent=validator)
    
    return Crew(
        agents=[scout, hunter, social, reviewer, validator],
        tasks=[t1, t2, t3, t4, t5],
        process=Process.sequential
    )

def build_comparator_crew(company_list: list) -> Crew:
    llm = get_llm_config("gemini")
    comparator = Agent(
        role="Company Comparator",
        goal=f"Compare {', '.join(company_list)}",
        backstory="Expert at side-by-side comparisons.",
        llm=llm
    )
    t = Task(description=f"Compare {company_list}", expected_output="Comparison JSON", agent=comparator)
    return Crew(agents=[comparator], tasks=[t], process=Process.sequential)
