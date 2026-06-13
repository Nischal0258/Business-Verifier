"""LLM-based company history summarization using Gemini Flash with fallback."""

import logging
import os
from typing import Optional, Tuple

from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

logger = logging.getLogger(__name__)

_GEMINI_API_KEY: Optional[str] = os.getenv("Gemini_API_KEY") or os.getenv("GEMINI_API_KEY")
_MODEL: Optional[genai.GenerativeModel] = None

if _GEMINI_API_KEY:
    genai.configure(api_key=_GEMINI_API_KEY)
    _MODEL = genai.GenerativeModel("gemini-2.0-flash")
    logger.info("Gemini Flash model initialized for summarization.")
else:
    logger.warning("GEMINI_API_KEY not set. Operating in Mock Mode for summarization.")

_MOCK_HISTORY = (
    "This company has established itself as a notable player in its industry "
    "over the past decade. Founded with a clear strategic vision, it has "
    "consistently expanded its market presence and diversified its revenue "
    "streams. The leadership team has navigated various economic cycles, "
    "demonstrating resilience and adaptability in the face of challenges.\n\n"
    "In recent years, the firm has invested heavily in technology and "
    "operational efficiency, resulting in improved margins and stronger "
    "customer retention. Partnerships with key stakeholders have further "
    "solidified its competitive position and opened new avenues for growth "
    "both domestically and internationally.\n\n"
    "Looking ahead, the company is poised to capitalise on emerging trends "
    "and evolving consumer preferences. Its commitment to innovation and "
    "sustainable practices positions it well for long-term success in an "
    "increasingly dynamic marketplace."
)

_SYSTEM_PROMPT = (
    "You are a professional business analyst. Write a concise, "
    "3-paragraph company history based on the raw information provided. "
    "Each paragraph should cover a distinct era: founding / early years, "
    "growth / expansion, and recent / current status. Use a formal tone."
)


async def summarize_history(raw_data: str) -> Tuple[str, bool]:
    """Generate a professional 3-paragraph company history via Gemini Flash.

    Returns a tuple of (summary_text, is_mock) so callers can indicate
    mock mode in API responses.

    Parameters
    ----------
    raw_data:
        Raw scraped / textual context about the company.

    Returns
    -------
    Tuple[str, bool]
        (summary_text, is_mock) — is_mock=True when using fallback.
    """
    if not _GEMINI_API_KEY or _MODEL is None:
        logger.warning("Gemini API key not configured. Returning mock history.")
        return _MOCK_HISTORY, True

    try:
        prompt = f"{_SYSTEM_PROMPT}\n\nCompany information:\n{raw_data}"
        response = await _MODEL.generate_content_async(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=600,
            ),
        )
        return response.text.strip(), False
    except Exception as exc:
        logger.warning("Gemini API call failed (%s). Falling back to mock history.", exc)
        return _MOCK_HISTORY, True
