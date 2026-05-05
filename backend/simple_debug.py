#!/usr/bin/env python3
"""Ultra-simple debug script that stays running."""

import os
import sys
import time
import logging

# Force unbuffered output
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

print("=== ULTRA-SIMPLE DEBUG ===", file=sys.stderr)
print(f"Python: {sys.version}", file=sys.stderr)
print(f"Working dir: {os.getcwd()}", file=sys.stderr)
print(f"PORT: {os.environ.get('PORT', 'NOT_SET')}", file=sys.stderr)

# Test basic imports
print("Testing imports...", file=sys.stderr)
try:
    import fastapi
    print(f"✓ FastAPI: {fastapi.__version__}", file=sys.stderr)
except Exception as e:
    print(f"✗ FastAPI failed: {e}", file=sys.stderr)

try:
    import uvicorn
    print(f"✓ Uvicorn: {uvicorn.__version__}", file=sys.stderr)
except Exception as e:
    print(f"✗ Uvicorn failed: {e}", file=sys.stderr)

# Keep the script running to prevent early exit
print("Keeping script alive for 60 seconds...", file=sys.stderr)
for i in range(60):
    print(f"Alive for {i+1} seconds...", file=sys.stderr)
    time.sleep(1)

print("=== DEBUG COMPLETE ===", file=sys.stderr)