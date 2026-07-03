"""Start the development server in the foreground.

Usage:
    python scripts/start_dev.py

Or use the .bat shortcut:
    scripts\dev.bat
"""
import subprocess
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent

print("Starting LifeHub backend server...")
print(f"  URL: http://localhost:8000")
print(f"  Docs: http://localhost:8000/docs")
print("  Press Ctrl+C to stop.\n")

p = subprocess.Popen(
    ["uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
    cwd=BACKEND_DIR,
)
try:
    p.wait()
except KeyboardInterrupt:
    p.terminate()
    print("\nServer stopped.")
    sys.exit(0)
