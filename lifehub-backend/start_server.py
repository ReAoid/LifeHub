"""Script to start and verify the LifeHub backend server."""
import subprocess
import sys
import time
import os
import json

backend_dir = r"E:\DevelopmentEnvironment\Python\project\LifeHub\lifehub-backend"
python_exe = r"C:\Users\rin\.conda\envs\lifehub\python.exe"
uvicorn_exe = r"C:\Users\rin\.conda\envs\lifehub\Scripts\uvicorn.exe"

print("=" * 60)
print("  Starting LifeHub Backend...")
print("=" * 60)

p = subprocess.Popen(
    [uvicorn_exe, "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
    cwd=backend_dir,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
)

# Save PID
with open(os.path.join(backend_dir, "server.pid"), "w") as f:
    f.write(str(p.pid))

time.sleep(4)

# Check if running
import urllib.request

try:
    resp = urllib.request.urlopen("http://localhost:8000/api/health", timeout=3)
    data = json.loads(resp.read().decode())
    print("\n[SUCCESS] Backend is running!")
    print(f"          URL: http://localhost:8000")
    print(f"          Swagger: http://localhost:8000/docs")
    print(f"          Health: {json.dumps(data, ensure_ascii=False)}")
    
    # Test register
    print("\n--- Testing Registration ---")
    req_data = json.dumps({"username": "testuser", "email": "test@example.com", "password": "password123"}).encode()
    req = urllib.request.Request("http://localhost:8000/api/auth/register", data=req_data, 
                                  headers={"Content-Type": "application/json"})
    try:
        resp = urllib.request.urlopen(req)
        result = json.loads(resp.read().decode())
        print(f"  [OK] Register: {result.get('data', {}).get('username')}")
    except urllib.error.HTTPError as e:
        result = json.loads(e.read().decode())
        print(f"  [INFO] {result.get('message')}")
    
    # Test login
    print("\n--- Testing Login ---")
    req_data = json.dumps({"username": "testuser", "password": "password123"}).encode()
    req = urllib.request.Request("http://localhost:8000/api/auth/login", data=req_data,
                                  headers={"Content-Type": "application/json"})
    resp = urllib.request.urlopen(req)
    result = json.loads(resp.read().decode())
    token = result.get('data', {}).get('access_token', '')
    print(f"  [OK] Login successful, token: {token[:30]}...")
    
    # Test tags
    print("\n--- Testing Tags API ---")
    req = urllib.request.Request("http://localhost:8000/api/tags",
                                  headers={"Authorization": f"Bearer {token}"})
    resp = urllib.request.urlopen(req)
    result = json.loads(resp.read().decode())
    print(f"  [OK] Tags: {result}")
    
    print("\n" + "=" * 60)
    print("  ALL TESTS PASSED!")
    print("  You can now open http://localhost:5173 for the frontend")
    print("=" * 60)
    
except urllib.error.URLError as e:
    # Read server output
    time.sleep(1)
    p.terminate()
    output = p.stdout.read(5000).decode(errors="replace")
    print("\n[FAILED] Server error:")
    print(output)
    
except Exception as e:
    print(f"\n[FAILED] {e}")
    p.terminate()
