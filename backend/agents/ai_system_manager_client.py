"""HTTP client for the AI System Manager microservice."""
import logging
import os
from typing import Any, Dict, Optional

import httpx

logger = logging.getLogger(__name__)

# Default to localhost:8001 in dev; override via env in prod
SERVICE_URL = os.getenv("AI_SYSTEM_MANAGER_URL", "http://127.0.0.1:8001")
TIMEOUT = 300.0  # Crew kickoff can take 30–180s


async def kickoff_ai_system_manager(
    industry: str,
    location: str,
    query: Optional[str] = None,
) -> Dict[str, Any]:
    """Call the AI System Manager service to execute the multi-agent crew.

    Returns the raw kickoff response dict.
    Raises httpx.HTTPError on transport failure.
    """
    payload = {"industry": industry, "location": location}
    if query:
        payload["query"] = query

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.post(f"{SERVICE_URL}/kickoff", json=payload)
        resp.raise_for_status()
        return resp.json()