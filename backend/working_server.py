#!/usr/bin/env python3
"""Working FastAPI server that stays running."""

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

logger.info("=== WORKING FASTAPI SERVER ===")
logger.info(f"Python: {sys.version}")
logger.info(f"Working directory: {os.getcwd()}")
logger.info(f"PORT: {os.environ.get('PORT', 'NOT_SET')}")

# Create minimal app
app = FastAPI(title="Working API", version="1.0.0")

@app.get("/")
async def root():
    logger.info("Root endpoint called successfully!")
    return {
        "message": "FastAPI is working on Render!",
        "python_version": sys.version,
        "working_dir": os.getcwd(),
        "port": os.environ.get('PORT', 'NOT_SET'),
        "status": "SUCCESS"
    }

@app.get("/health")
async def health():
    logger.info("Health check called successfully!")
    return {"status": "healthy", "service": "working-api"}

logger.info("=== APP INITIALIZED SUCCESSFULLY ===")
logger.info("Starting uvicorn server...")

# Import uvicorn and start server
import uvicorn
port = int(os.environ.get("PORT", 8000))
logger.info(f"Starting server on port {port}")

# This will keep the server running
uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")