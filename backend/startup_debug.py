#!/usr/bin/env python3
"""Startup script to force error visibility on Render."""

import os
import sys
import subprocess
import traceback

print("=== FORCED STARTUP DEBUG ===", file=sys.stderr)
print(f"Python: {sys.version}", file=sys.stderr)
print(f"Working dir: {os.getcwd()}", file=sys.stderr)
print(f"PORT: {os.environ.get('PORT', 'NOT_SET')}", file=sys.stderr)

# Test basic imports first
print("Testing basic imports...", file=sys.stderr)
try:
    import fastapi
    print(f"✓ FastAPI imported: {fastapi.__version__}", file=sys.stderr)
except Exception as e:
    print(f"✗ FastAPI import failed: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)

try:
    import uvicorn
    print(f"✓ Uvicorn imported: {uvicorn.__version__}", file=sys.stderr)
except Exception as e:
    print(f"✗ Uvicorn import failed: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)

# Test importing main.py
print("Testing main.py import...", file=sys.stderr)
try:
    # Change to backend directory to ensure proper imports
    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(base_dir)
    sys.path.insert(0, base_dir)
    
    # Try to import main module
    import main
    print(f"✓ main.py imported successfully", file=sys.stderr)
    
    # Check if app exists
    if hasattr(main, 'app'):
        print(f"✓ FastAPI app found in main.py", file=sys.stderr)
    else:
        print(f"✗ No 'app' found in main.py", file=sys.stderr)
        
except Exception as e:
    print(f"✗ main.py import failed: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)

# Try direct uvicorn command
print("Attempting direct uvicorn start...", file=sys.stderr)
try:
    cmd = [
        sys.executable, "-m", "uvicorn", 
        "main:app", 
        "--host", "0.0.0.0", 
        "--port", os.environ.get("PORT", "8000"),
        "--log-level", "debug"
    ]
    print(f"Command: {' '.join(cmd)}", file=sys.stderr)
    
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
    
    print(f"Return code: {result.returncode}", file=sys.stderr)
    print(f"STDOUT: {result.stdout}", file=sys.stderr)
    print(f"STDERR: {result.stderr}", file=sys.stderr)
    
except subprocess.TimeoutExpired:
    print("✓ Uvicorn started successfully (timeout after 10s)", file=sys.stderr)
except Exception as e:
    print(f"✗ Uvicorn start failed: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)

print("=== STARTUP DEBUG COMPLETE ===", file=sys.stderr)
sys.exit(0)  # Success to keep container running