"""Kill any process listening on a given port (default 8000).

Usage:
    python scripts/kill_port.py [port]
"""
import subprocess
import sys

PORT = sys.argv[1] if len(sys.argv) > 1 else "8000"

result = subprocess.run(["netstat", "-ano"], capture_output=True, text=True)
found = False
for line in result.stdout.splitlines():
    if f":{PORT}" in line and "LISTENING" in line:
        pid = line.strip().split()[-1]
        subprocess.run(["taskkill", "/F", "/PID", pid], capture_output=True)
        print(f"Killed PID {pid} on port {PORT}")
        found = True

if not found:
    print(f"No process listening on port {PORT}")
