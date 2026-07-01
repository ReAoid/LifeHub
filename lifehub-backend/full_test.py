"""Full integration test: start server, test APIs, show all output."""
import subprocess
import time
import json
import urllib.request
import os

backend_dir = r"E:\DevelopmentEnvironment\Python\project\LifeHub\lifehub-backend"
logfile = os.path.join(backend_dir, "full_test.log")

# Remove old DB
for f in ["lifehub.db", "lifehub.db-wal", "lifehub.db-shm"]:
    p = os.path.join(backend_dir, f)
    if os.path.exists(p):
        os.remove(p)
        print(f"Removed {f}")

# Start server
with open(logfile, "w", encoding="utf-8") as f:
    p = subprocess.Popen(
        [r"C:\Users\rin\.conda\envs\lifehub\Scripts\uvicorn.exe", "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=backend_dir,
        stdout=f,
        stderr=subprocess.STDOUT,
    )

time.sleep(5)

def call(method, path, data=None, token=None):
    url = f"http://localhost:8000{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    r = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(r)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

print("=" * 60)
print("  INTEGRATION TEST")
print("=" * 60)

# 1. Health
status, data = call("GET", "/api/health")
print(f"\n[1] Health: {'OK' if status == 200 else 'FAIL'} ({status})")
print(f"    {json.dumps(data, ensure_ascii=False)}")

# 2. Register
status, data = call("POST", "/api/auth/register", {
    "username": "demo", "email": "demo@lifehub.app", "password": "demo123"
})
print(f"\n[2] Register: {'OK' if status == 200 else 'FAIL'} ({status})")
print(f"    {json.dumps(data, ensure_ascii=False)}")

# 3. Login
status, data = call("POST", "/api/auth/login", {
    "username": "demo", "password": "demo123"
})
token = data.get("data", {}).get("access_token", "")
print(f"\n[3] Login: {'OK' if status == 200 and token else 'FAIL'} ({status})")
if token:
    print(f"    Token: {token[:40]}...")
else:
    print(f"    {json.dumps(data, ensure_ascii=False)}")

# 4. Tags CRUD (if authenticated)
if token:
    status, data = call("GET", "/api/tags", token=token)
    print(f"\n[4] List Tags: {status} ({len(data.get('data', []))} tags)")
    
    status, data = call("POST", "/api/tags", {"name": "important", "color": "#ef4444"}, token=token)
    print(f"[5] Create Tag: {'OK' if status == 200 else 'FAIL'} ({status})")
    if status == 200:
        tag_id = data.get("data", {}).get("id", "")
        print(f"    Created tag: {tag_id[:8]}...")
        
        status, data = call("GET", f"/api/tags/{tag_id}", token=token)
        print(f"[6] Get Tag: {'OK' if status == 200 else 'FAIL'} ({status})")
        
        status, data = call("DELETE", f"/api/tags/{tag_id}", token=token)
        print(f"[7] Delete Tag: {'OK' if status == 200 else 'FAIL'} ({status})")

# 5. Swagger docs
status, data = call("GET", "/docs")
print(f"\n[8] Swagger Docs: {'Available' if status == 200 else 'FAIL'} ({status})")

# Read logs if there was an error
if not token:
    time.sleep(2)
    with open(logfile, encoding="utf-8") as f:
        logs = f.read()
    # Find ERROR or Traceback lines
    for line in logs.split("\n"):
        if "ERROR" in line or "Traceback" in line or "Error" in line:
            print(f"\n  LOG: {line}")

print("\n" + "=" * 60)
print("  TESTS COMPLETE")
print("=" * 60)

# Keep server running for manual testing
# p.terminate()
print(f"\nServer PID: {p.pid} (leave running)")
print(f"Full log: {logfile}")
