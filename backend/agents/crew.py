"""CrewAI crew builders for the student-first company research pipeline.

Exposes three public functions consumed by ``main.py``:

    from agents.crew import build_student_report_crew, build_comparator_crew, build_conversational_crew
"""

import logging
from typing import List

from crewai import Agent, Crew, Process, Task

from .config import AgentConfig
from .tools import (
    fetch_registry_data_tool,
    scrape_website_tool,
    fetch_job_listings_tool,
    search_local_startups_tool,
    social_media_search_tool,
    review_search_tool,
)

logger = logging.getLogger(__name__)


# ------------------------------------------------------------------
# Internal helpers
# ------------------------------------------------------------------

def _make_agent(cfg: AgentConfig, key: str, **extra) -> Agent:
    """Create a CrewAI Agent from the centralized config.

    ``key`` must match one of the keys in
    :pyattr:`AgentConfig.agent_configs`.
    """
    ac = cfg.agent_configs[key]
    llm = cfg.get_llm(ac.get("llm_provider", "gemini"))
    return Agent(
        role=ac["role"],
        goal=ac["goal"],
        backstory=ac["backstory"],
        allow_delegation=ac.get("allow_delegation", False),
        verbose=ac.get("verbose", True),
        llm=llm,
        **extra,
    )


# ------------------------------------------------------------------
# Public API
# ------------------------------------------------------------------

def build_student_report_crew(company_name: str) -> Crew:
    """Build a sequential crew that researches a company for students.

    **Agents** (5):
        1. Company Scout
        2. Opportunity Hunter
        3. Social Media Detective
        4. Review Analyst
        5. Trust Score Evaluator

    **Tasks** (5, sequential — each feeds into the next):
        1. Research company basics  (tools: fetch_registry_data, scrape_website)
        2. Find internships / jobs  (tools: fetch_job_listings, search_local_startups)
        3. Find social media profiles (tools: social_media_search)
        4. Analyse reviews           (tools: review_search)
        5. Calculate trust score      (no tools — uses context from 1-4)

    Args:
        company_name: Company to research.

    Returns:
        A ready-to-kickoff :class:`crewai.Crew`.
    """
    cfg = AgentConfig()

    # ----- agents -----
    scout = _make_agent(cfg, "company_researcher")
    hunter = _make_agent(cfg, "job_discovery_specialist")
    social = _make_agent(cfg, "social_media_aggregator")
    reviewer = _make_agent(cfg, "review_analyzer")
    validator = _make_agent(cfg, "data_validator")

    # ----- tasks -----
    task_basics = Task(
        description=(
            f"Research the company '{company_name}'. "
            "Use the registry data tool with the company name, then try to "
            "scrape their official website if you find a URL. "
            "Return a JSON object with keys: company_name, industry, "
            "employee_count, founded, headquarters, website, description."
        ),
        expected_output=(
            "A JSON object with company basics: company_name, industry, "
            "employee_count, founded, headquarters, website, description."
        ),
        agent=scout,
        tools=[fetch_registry_data_tool, scrape_website_tool],
    )

    task_opportunities = Task(
        description=(
            f"Find internship and job listings at '{company_name}'. "
            "Search job boards and startup directories. "
            "Return a JSON array of opportunities with keys: title, "
            "location, type, stipend, skills_required, apply_url, source."
        ),
        expected_output=(
            "A JSON array of opportunity objects, each with title, "
            "location, type, stipend, skills_required, apply_url, source."
        ),
        agent=hunter,
        tools=[fetch_job_listings_tool, search_local_startups_tool],
    )

    task_social = Task(
        description=(
            f"Find social media profiles for '{company_name}' on LinkedIn, "
            "Instagram, and Twitter/X. Return a JSON object with "
            "linkedin_url, instagram_url, twitter_url, active_platforms, "
            "and social_presence_score."
        ),
        expected_output=(
            "A JSON object with linkedin_url, instagram_url, twitter_url, "
            "active_platforms (list), and social_presence_score (int)."
        ),
        agent=social,
        tools=[social_media_search_tool],
    )

    task_reviews = Task(
        description=(
            f"Search for employee and intern reviews of '{company_name}' "
            "on Glassdoor and AmbitionBox. Return a JSON object with "
            "average_rating, review_count, pros (list), cons (list)."
        ),
        expected_output=(
            "A JSON object with average_rating, review_count, "
            "pros (list of strings), cons (list of strings)."
        ),
        agent=reviewer,
        tools=[review_search_tool],
    )

    task_trust = Task(
        description=(
            f"You are evaluating '{company_name}' for students. "
            "Using the data collected in the previous tasks "
            "(company basics, opportunities, social media, reviews), "
            "calculate a student trust score from 0 to 100. "
            "Consider: data completeness, number of opportunities found, "
            "social media presence, review ratings, and overall credibility. "
            "Return a JSON object with: total_score, is_recommended (bool), "
            "company_tier (one of: established, rising_star, unknown), "
            "breakdown (dict of component scores), verdict (one sentence)."
        ),
        expected_output=(
            "A JSON object with total_score (int 0-100), is_recommended "
            "(bool), company_tier (str), breakdown (dict), verdict (str)."
        ),
        agent=validator,
        tools=[],  # reasoning only — uses context from earlier tasks
        context=[task_basics, task_opportunities, task_social, task_reviews],
    )

    # ----- crew -----
    crew = Crew(
        agents=[scout, hunter, social, reviewer, validator],
        tasks=[task_basics, task_opportunities, task_social, task_reviews, task_trust],
        process=Process.sequential,
        verbose=True,
    )

    logger.info(
        "Built student-report crew for '%s' with %d agents / %d tasks",
        company_name,
        len(crew.agents),
        len(crew.tasks),
    )
    return crew


def build_comparator_crew(company_list: List[str]) -> Crew:
    """Build a crew that compares multiple companies side-by-side.

    Uses two agents:
        1. **Company Scout** — gathers basics for each company.
        2. **Trust Score Evaluator** — produces a comparison table.

    Args:
        company_list: List of company names to compare.

    Returns:
        A ready-to-kickoff :class:`crewai.Crew`.
    """
    cfg = AgentConfig()

    scout = _make_agent(cfg, "company_researcher")
    validator = _make_agent(cfg, "data_validator")

    names = ", ".join(company_list)

    task_gather = Task(
        description=(
            f"Research the following companies: {names}. "
            "For each company, gather: industry, employee_count, founded, "
            "headquarters, website, and a one-sentence description. "
            "Return a JSON array with one object per company."
        ),
        expected_output=(
            "A JSON array of company objects, each with company_name, "
            "industry, employee_count, founded, headquarters, website, "
            "description."
        ),
        agent=scout,
        tools=[fetch_registry_data_tool, scrape_website_tool],
    )

    task_compare = Task(
        description=(
            f"Compare these companies: {names}. "
            "Using the research data, produce a comparison table with "
            "columns: Company, Industry, Size, Founded, Strengths, "
            "Weaknesses, and a recommended pick for students. "
            "Return the result as a JSON object with a 'comparison' array "
            "and a 'recommendation' string."
        ),
        expected_output=(
            "A JSON object with 'comparison' (array of per-company dicts) "
            "and 'recommendation' (string)."
        ),
        agent=validator,
        tools=[],
        context=[task_gather],
    )

    crew = Crew(
        agents=[scout, validator],
        tasks=[task_gather, task_compare],
        process=Process.sequential,
        verbose=True,
    )

    logger.info(
        "Built comparator crew for %d companies: %s",
        len(company_list),
        names,
    )
    return crew


def build_conversational_crew(user_query: str) -> Crew:
    """Build a conversational crew with Crew Manager that understands student queries.

    Args:
        user_query: Natural language query from student.

    Returns:
        A ready-to-kickoff CrewAI Crew.
    """
    cfg = AgentConfig()
    crew_manager = _make_agent(cfg, "crew_manager", allow_delegation=True)
    scout = _make_agent(cfg, "company_researcher")
    hunter = _make_agent(cfg, "job_discovery_specialist")
    social = _make_agent(cfg, "social_media_aggregator")
    reviewer = _make_agent(cfg, "review_analyzer")
    validator = _make_agent(cfg, "data_validator")

    task_understand = Task(
        description=(
            f"Analyze the student's query: '{user_query}'. "
            "Determine what specific company insights, trust score data, or comparisons they need. "
            "If they mention company names, extract them. Decide which sub-agents to involve. "
            "Delegate tasks to appropriate agents as needed."
        ),
        expected_output="A clear plan for answering the student's query, with delegated tasks to sub-agents.",
        agent=crew_manager,
    )

    task_answer = Task(
        description=(
            f"Synthesize all information gathered by sub-agents to answer the student's query: '{user_query}'. "
            "Provide a clear, student-friendly response with trust scores if applicable."
        ),
        expected_output="A friendly, informative, student-focused answer to the original query.",
        agent=crew_manager,
        context=[task_understand],
    )

    crew = Crew(
        agents=[crew_manager, scout, hunter, social, reviewer, validator],
        tasks=[task_understand, task_answer],
        process=Process.hierarchical,
        manager_agent=crew_manager,
        verbose=True,
    )

    logger.info(
        "Built conversational crew for query: '%s' with %d agents",
        user_query[:50] + ("..." if len(user_query) > 50 else ""),
        len(crew.agents),
    )
    return crew
