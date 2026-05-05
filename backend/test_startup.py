#!/usr/bin/env python3
"""Minimal FastAPI test to debug startup issues on Render."""

import os
import sys
import logging
from fastapi import FastAPI
from fastapi.responses import JSONResponse

# Force unbuffered output
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

logger.info("=== MINIMAL STARTUP TEST ===")
logger.info(f"Python: {sys.version}")
logger.info(f"Working directory: {os.getcwd()}")
logger.info(f"Files in current dir: {os.listdir('.')}")

# Test basic imports
try:
    import fastapi
    logger.info(f"FastAPI version: {fastapi.__version__}")
except Exception as e:
    logger.error(f"Failed to import FastAPI: {e}")
    sys.exit(1)

try:
    import pydantic
    logger.info(f"Pydantic version: {pydantic.__version__}")
except Exception as e:
    logger.error(f"Failed to import Pydantic: {e}")
    sys.exit(1)

# Create minimal app
app = FastAPI(title="Test API", version="1.0.0")

@app.get("/")
async def root():
    logger.info("Root endpoint called")
    return {"message": "Test API is working!"}

@app.get("/health")
async def health():
    logger.info("Health check called")
    return {"status": "healthy"}

logger.info("=== APP INITIALIZED SUCCESSFULLY ===")
logger.info("Starting uvicorn...")

if __name__ == "__main__":
    import uvicorn
    logger.info("Running uvicorn directly")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")