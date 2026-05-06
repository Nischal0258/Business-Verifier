"""LLM-based company history summarization with real data fallback."""

import logging
import os
import asyncio
from typing import Optional

from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

logger = logging.getLogger(__name__)

_GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
if _GEMINI_API_KEY:
    genai.configure(api_key=_GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY is not set. Will use direct company descriptions.")


async def summarize_history(raw_data: str, company_description: Optional[str] = None) -> str:
    """Generate a professional company history.

    Strategy:
    1. If Gemini is available, use it to write a polished summary
    2. If Gemini fails/unavailable, use the real company description from Yahoo Finance
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
    # Try Gemini first
    if _GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = (
                f"You are a professional business analyst. Based on the following raw context "
                f"about {company_description if company_description else 'a company'}, "
                f"write a polished, concise, and neutral 3-4 sentence company history.\n\n"
                f"Context:\n{raw_data}\n\n"
                f"Summary:"
            )
            
            # Use a thread pool to call the synchronous Gemini API in an async context
            response = await asyncio.to_thread(model.generate_content, prompt)
            
            if response.text:
                logger.info("Gemini summarization successful")
                return response.text.strip()
                
        except Exception as exc:
            logger.warning(
                "Gemini API call failed (%s). Falling back to direct description.", exc
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
