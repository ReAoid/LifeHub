"""Quick test - starts server, tests register, shows logs, shuts down."""
import subprocess, time, json, urllib.request, os, sys

backend_dir = r"E:\DevelopmentEnvironment\Python\project\LifeHub\lifehub-backend"
logfile = r"E:\DevelopmentEnvironment\Python\project\LifeHub\lifehub-backend\server.log"

# Clean DB
for f in ["lifehub.db", "lifehub.db-wal", "lifehub.db-shm"]:
    p = os.path.join(backend_dir, f)
    if os.path.exists(p): os.remove(p)

# Start server
with open(logfile, "w", encoding="utf-8") as f:
    sp = subprocess.Popen(
        [r"C:\Users\rin\.conda\envs\lifehub\Scripts\uvicorn.exe", "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=backend_dir, stdout=f, stderr=subprocess.STDOUT)
time.sleep(6)

# Test register
data = json.dumps({"username": "demo", "email": "demo@lifehub.app", "password": "demo123"}).encode()
req = urllib.request.Request("http://localhost:8000/api/auth/register", data=data,
                              headers={"Content-Type": "application/json"})
try:
    r = urllib.request.urlopen(req)
    print("REGISTER SUCCESS:", r.read().decode())
except urllib.error.HTTPError as e:
    print("REGISTER FAILED:", e.code, e.read().decode())

# Check log
time.sleep(2)
with open(logfile, encoding="utf-8") as f:
    log = f.read()

if "Traceback" in log:
    idx = log.rfind("Traceback")
    print("\n=== TRACEBACK ===")
    print(log[idx:idx+1500])
else:
    print("\nNo traceback found. Server is OK!")
    print("Check http://localhost:8000/docs")

sp.terminate()
time.sleep(1)
sp.wait()
print("Server stopped.")
