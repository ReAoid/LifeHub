"""Debug the registration error."""
import subprocess
import time
import json
import urllib.request

backend_dir = r"E:\DevelopmentEnvironment\Python\project\LifeHub\lifehub-backend"
python_exe = r"C:\Users\rin\.conda\envs\lifehub\python.exe"
uvicorn_exe = r"C:\Users\rin\.conda\envs\lifehub\Scripts\uvicorn.exe"

# Start server with stderr captured
p = subprocess.Popen(
    [uvicorn_exe, "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
    cwd=backend_dir,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
)
time.sleep(5)

# Read initial output
initial = p.stdout.read(3000).decode(errors="replace")

# Make register request
try:
    data = json.dumps({"username": "testuser", "email": "test@example.com", "password": "password123"}).encode()
    req = urllib.request.Request("http://localhost:8000/api/auth/register", data=data,
                                  headers={"Content-Type": "application/json"})
    resp = urllib.request.urlopen(req)
    print("Register RESPONSE:", resp.read().decode())
except urllib.error.HTTPError as e:
    print(f"Register ERROR ({e.code}): {e.read().decode(errors='replace')}")

# Wait for more output
time.sleep(2)

# Read remaining server output
remaining = p.stdout.read(5000).decode(errors="replace")
print("\n=== SERVER LOGS ===")
print(initial)
print(remaining)

p.terminate()
