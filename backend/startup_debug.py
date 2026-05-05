#!/usr/bin/env python3
"""Startup script to force error visibility on Render."""

import os
import sys
import subprocess

print("=== FORCED STARTUP DEBUG ===", file=sys.stderr)
print(f"Python: {sys.version}", file=sys.stderr)
print(f"Working dir: {os.getcwd()}", file=sys.stderr)
print(f"Files: {os.listdir('.')}", file=sys.stderr)
print(f"ENV vars: {dict(os.environ)}", file=sys.stderr)

# Try to run the actual app
try:
    print("Attempting to start main app...", file=sys.stderr)
    result = subprocess.run([
        sys.executable, "-m", "uvicorn", 
        "main:app", 
        "--host", "0.0.0.0", 
        "--port", os.environ.get("PORT", "8000"),
        "--log-level", "debug"
    ], capture_output=True, text=True)
    
    print(f"STDOUT: {result.stdout}", file=sys.stderr)
    print(f"STDERR: {result.stderr}", file=sys.stderr)
    print(f"Return code: {result.returncode}", file=sys.stderr)
    
except Exception as e:
    print(f"Failed to start: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc(file=sys.stderr)

print("=== STARTUP DEBUG COMPLETE ===", file=sys.stderr)
sys.exit(1)  # Force failure to see output