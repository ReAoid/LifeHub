"""Debug: capture ALL output from server."""
import subprocess
import time
import json
import threading
import os

backend_dir = r"E:\DevelopmentEnvironment\Python\project\LifeHub\lifehub-backend"
uvicorn_exe = r"C:\Users\rin\.conda\envs\lifehub\Scripts\uvicorn.exe"
logfile = os.path.join(backend_dir, "server_debug.log")

# Start server, redirect ALL output to a file
with open(logfile, "w") as f:
    p = subprocess.Popen(
        [uvicorn_exe, "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=backend_dir,
        stdout=f,
        stderr=subprocess.STDOUT,
    )

time.sleep(6)

# Test health
import urllib.request
try:
    r = urllib.request.urlopen("http://localhost:8000/api/health")
    print("Health:", r.read().decode())
except Exception as e:
    print(f"Health failed: {e}")

# Test register
try:
    data = json.dumps({"username": "testuser", "email": "test@example.com", "password": "password123"}).encode()
    req = urllib.request.Request("http://localhost:8000/api/auth/register", data=data,
                                  headers={"Content-Type": "application/json"})
    r = urllib.request.urlopen(req)
    print("Register OK:", r.read().decode())
except urllib.error.HTTPError as e:
    print(f"Register ERROR {e.code}: {e.read().decode()}")

time.sleep(3)

p.terminate()
time.sleep(1)

# Read the full log
with open(logfile) as f:
    content = f.read()

print("\n=== FULL SERVER LOG ===")
# Print last 3000 chars (where the error should be)
print(content[-3000:])
print("========================")
