"""FastAPI wrapper around the AiSystemManager Crew."""
import asyncio
import logging
import sys
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add the package to path
sys.path.insert(0, "src")

from ai_system_manager.crew import AiSystemManagerCrew

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AI System Manager service starting up...")
    yield
    logger.info("AI System Manager service shutting down...")


app = FastAPI(
    title="AI System Manager Service",
    description="Multi-agent crew for job sourcing and company intelligence",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    industry: str
    location: str
    query: str | None = None  # optional free-form context


class ChatResponse(BaseModel):
    success: bool
    response: str
    metadata: Dict[str, Any]


@app.get("/")
async def root():
    return {
        "service": "AI System Manager",
        "status": "ready",
        "version": "1.0.0",
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.post("/kickoff", response_model=ChatResponse)
async def kickoff_crew(req: ChatRequest):
    """Execute the AI System Manager crew with dynamic inputs."""
    if not req.industry or not req.location:
        raise HTTPException(status_code=400, detail="industry and location are required")

    try:
        logger.info(f"Kickoff crew: industry={req.industry}, location={req.location}")
        crew = AiSystemManagerCrew().crew()
        inputs = {"industry": req.industry, "location": req.location}

        # Run blocking kickoff in a thread
        result = await asyncio.to_thread(crew.kickoff, inputs)

        return ChatResponse(
            success=True,
            response=str(result),
            metadata={
                "agents_used": len(crew.agents),
                "tasks_completed": len(crew.tasks),
                "industry": req.industry,
                "location": req.location,
            },
        )
    except Exception as e:
        logger.exception("Crew execution failed")
        raise HTTPException(status_code=500, detail=f"Crew failed: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8001, reload=False)