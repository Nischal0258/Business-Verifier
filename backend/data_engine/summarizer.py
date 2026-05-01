"""LLM-based company history summarization with real data fallback."""

import logging
import os
from typing import Optional

from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

logger = logging.getLogger(__name__)

_OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
_CLIENT: Optional[AsyncOpenAI] = None
if _OPENAI_API_KEY:
    _CLIENT = AsyncOpenAI(api_key=_OPENAI_API_KEY)
else:
    logger.warning("OPENAI_API_KEY is not set. Will use direct company descriptions.")


async def summarize_history(raw_data: str, company_description: Optional[str] = None) -> str:
    """Generate a professional company history.

    Strategy:
    1. If OpenAI is available, use GPT to write a polished summary
    2. If OpenAI fails/unavailable, use the real company description from Yahoo Finance
    3. If no description available, return a data-based summary from the raw context

    Parameters
    ----------
    raw_data:
        Raw context about the company (registry + financials).
    company_description:
        Real business description from Yahoo Finance (if available).

    Returns
    -------
    str
        A professional company history.
    """
    # Try OpenAI first
    if _OPENAI_API_KEY and _CLIENT:
        try:
            prompt_context = raw_data
            if company_description:
                prompt_context = f"{raw_data}\n\nCompany Description:\n{company_description}"

            system_prompt = (
                "You are a professional business analyst. Write a concise, "
                "3-paragraph company history based on the information provided. "
                "Paragraph 1: Company overview and what they do. "
                "Paragraph 2: Key business areas and market position. "
                "Paragraph 3: Recent developments and outlook. "
                "Use a formal, factual tone. Include specific details from the data provided. "
                "Do NOT make up information that isn't in the context."
            )

            response = await _CLIENT.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt_context},
                ],
                temperature=0.5,
                max_tokens=600,
            )
            result = response.choices[0].message.content.strip()
            logger.info("OpenAI summarization successful")
            return result
        except Exception as exc:
            logger.warning(
                "OpenAI API call failed (%s). Falling back to direct description.", exc
            )

    # Fallback: Use the real company description from Yahoo Finance
    if company_description and len(company_description) > 100:
        logger.info("Using Yahoo Finance company description as fallback")
        return company_description

    # Final fallback: Use the raw data itself
    logger.info("Using raw data context as final fallback")
    return (
        f"Based on available data:\n\n{raw_data}\n\n"
        "Note: Detailed company history could not be generated. "
        "The information above is sourced from public financial records."
    )
