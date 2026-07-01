"""Kill server on port 8000."""
import subprocess
import os

# Read PID file
pidfile = r"E:\DevelopmentEnvironment\Python\project\LifeHub\lifehub-backend\server.pid"
if os.path.exists(pidfile):
    with open(pidfile) as f:
        pid = f.read().strip()
    if pid:
        subprocess.run(["taskkill", "/F", "/PID", pid], capture_output=True)
        os.remove(pidfile)
        print(f"Killed process {pid}")
else:
    # Try by port
    result = subprocess.run(
        ["netstat", "-ano"], capture_output=True, text=True
    )
    for line in result.stdout.splitlines():
        if ":8000" in line and "LISTENING" in line:
            parts = line.strip().split()
            pid = parts[-1]
            subprocess.run(["taskkill", "/F", "/PID", pid], capture_output=True)
            print(f"Killed process on port 8000 (PID: {pid})")
            break
    else:
        print("No process on port 8000")
