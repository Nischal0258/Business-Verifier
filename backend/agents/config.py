"""Configuration for CrewAI agents in the internship platform.

Supports multiple LLM providers:
- Gemini (default)  — general-purpose reasoning
- Groq              — fast opportunity parsing
- NVIDIA NIM        — complex reasoning tasks
"""

import logging
import os
from typing import Any, Dict, Optional

from crewai import LLM
from config import settings

logger = logging.getLogger(__name__)


class AgentConfig:
    """Centralized configuration for all AI agents in the internship platform.

    Manages multiple LLM backends and falls back to Gemini when a
    provider-specific API key is missing.
    """

    def __init__(self) -> None:
        self._gemini_key: str = settings.gemini_api_key
        self._groq_key: str = settings.groq_api_key
        self._nvidia_key: str = settings.nvidia_api_key

    # ------------------------------------------------------------------
    # LLM factory helpers
    # ------------------------------------------------------------------

    def get_gemini_llm(self) -> LLM:
        """Primary Gemini LLM used as the default / fallback."""
        os.environ.setdefault("GEMINI_API_KEY", self._gemini_key)
        return LLM(
            model="gemini/gemini-2.0-flash",
            temperature=0.2,
        )

    def get_groq_llm(self) -> LLM:
        """Fast Groq LLM for opportunity parsing.  Falls back to Gemini."""
        if not self._groq_key:
            logger.warning("GROQ_API_KEY missing — falling back to Gemini")
            return self.get_gemini_llm()
        os.environ.setdefault("GROQ_API_KEY", self._groq_key)
        return LLM(
            model="groq/llama-3.1-8b-instant",
            temperature=0.1,
        )

    def get_nvidia_llm(self) -> LLM:
        """NVIDIA NIM LLM for complex reasoning.  Falls back to Gemini."""
        if not self._nvidia_key:
            logger.warning("NVIDIA_API_KEY missing — falling back to Gemini")
            return self.get_gemini_llm()
        os.environ.setdefault("NVIDIA_API_KEY", self._nvidia_key)
        return LLM(
            model="nvidia_nim/meta/llama3-70b-instruct",
            base_url="https://integrate.api.nvidia.com/v1",
            temperature=0.2,
        )

    def get_llm(self, provider: str = "gemini") -> LLM:
        """Return an LLM instance for the requested provider.

        Args:
            provider: One of "gemini", "groq", or "nvidia".

        Returns:
            A crewai.LLM instance (falls back to Gemini if the
            requested provider key is not configured).
        """
        dispatch = {
            "gemini": self.get_gemini_llm,
            "groq": self.get_groq_llm,
            "nvidia": self.get_nvidia_llm,
        }
        factory = dispatch.get(provider, self.get_gemini_llm)
        return factory()

    # ------------------------------------------------------------------
    # Agent role definitions
    # ------------------------------------------------------------------

    @property
    def agent_configs(self) -> Dict[str, Dict[str, Any]]:
        """Agent role configurations for the internship platform.

        Seven roles total:
        api_orchestrator, company_researcher, job_discovery_specialist,
        social_media_aggregator, review_analyzer, data_validator, student_matcher.
        """
        return {
            "crew_manager": {
                "role": "Crew Manager",
                "goal": (
                    "Understand student queries, delegate tasks to specialized sub-agents, and synthesize responses with trust scores."
                ),
                "backstory": (
                    "You are a friendly, student-focused AI manager. You listen to what students need, delegate research tasks to the right specialists, and compile clear, helpful answers with company trust scores if applicable."
                ),
                "allow_delegation": True,
                "verbose": True,
                "llm_provider": "gemini",
            },
            "api_orchestrator": {
                "role": "Manager",
                "goal": (
                    "Coordinate all agents, ensure tasks execute in the "
                    "correct order, and merge results into one report."
                ),
                "backstory": (
                    "You are a senior project manager who oversees the "
                    "research pipeline.  You delegate work to specialists, "
                    "resolve conflicting information, and produce a unified, "
                    "student-friendly company report."
                ),
                "allow_delegation": True,
                "verbose": True,
                "llm_provider": "gemini",
            },
            "company_researcher": {
                "role": "Company Scout",
                "goal": (
                    "Research a company's basics — founding info, industry, "
                    "employee count, headquarters, and website."
                ),
                "backstory": (
                    "You are an expert OSINT researcher.  You pull company "
                    "registry data, scrape official websites, and compile a "
                    "factual overview that other agents can build on."
                ),
                "allow_delegation": False,
                "verbose": True,
                "llm_provider": "gemini",
            },
            "job_discovery_specialist": {
                "role": "Opportunity Hunter",
                "goal": (
                    "Find every open internship, job, or freelance gig at "
                    "the target company."
                ),
                "backstory": (
                    "You are a career-services specialist who scours job "
                    "boards, company career pages, and startup ecosystems "
                    "to surface opportunities students would never find "
                    "on their own."
                ),
                "allow_delegation": False,
                "verbose": True,
                "llm_provider": "groq",
            },
            "social_media_aggregator": {
                "role": "Social Media Detective",
                "goal": (
                    "Locate the company's social media profiles on LinkedIn, "
                    "Instagram, and Twitter/X."
                ),
                "backstory": (
                    "You track corporate social-media footprints across "
                    "platforms, analyse engagement metrics, and flag "
                    "suspicious or inactive accounts."
                ),
                "allow_delegation": False,
                "verbose": True,
                "llm_provider": "gemini",
            },
            "review_analyzer": {
                "role": "Review Analyst",
                "goal": (
                    "Aggregate and summarize employee and intern reviews "
                    "from Glassdoor, AmbitionBox, and similar platforms."
                ),
                "backstory": (
                    "You are a sentiment-analysis expert who reads between "
                    "the lines of employee reviews.  You extract ratings, "
                    "common pros/cons, and highlight themes relevant to "
                    "students considering internships."
                ),
                "allow_delegation": False,
                "verbose": True,
                "llm_provider": "gemini",
            },
            "data_validator": {
                "role": "Trust Score Evaluator",
                "goal": (
                    "Calculate a 0-100 student trust score by cross-referencing "
                    "all data gathered by the other agents."
                ),
                "backstory": (
                    "You are a due-diligence analyst.  You weigh data "
                    "completeness, source reliability, review sentiment, "
                    "and social-media presence to produce a single trust "
                    "score with a detailed breakdown."
                ),
                "allow_delegation": False,
                "verbose": True,
                "llm_provider": "nvidia",
            },
            "student_matcher": {
                "role": "Student Matcher",
                "goal": (
                    "Match student profiles with the best opportunities "
                    "at the target company."
                ),
                "backstory": (
                    "You are a career counsellor who understands both "
                    "student aspirations and employer needs.  You rank "
                    "opportunities by fit and explain your reasoning."
                ),
                "allow_delegation": False,
                "verbose": True,
                "llm_provider": "gemini",
            },
        }
