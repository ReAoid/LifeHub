"""Test script - check if backend is running."""
import urllib.request
import json

try:
    resp = urllib.request.urlopen("http://localhost:8000/api/health")
    data = json.loads(resp.read().decode())
    print("=" * 50)
    print("BACKEND STATUS:", "✅ RUNNING" if data.get("code") == 0 else "❌ ERROR")
    print("Response:", json.dumps(data, indent=2, ensure_ascii=False))
    print("=" * 50)

    # Test register
    print("\n--- Testing Registration ---")
    register_data = json.dumps({
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
    }).encode()
    req = urllib.request.Request(
        "http://localhost:8000/api/auth/register",
        data=register_data,
        headers={"Content-Type": "application/json"}
    )
    try:
        resp = urllib.request.urlopen(req)
        print("✅ Register:", json.loads(resp.read().decode()))
    except urllib.error.HTTPError as e:
        print("ℹ️  Register response:", e.code, e.read().decode())

    # Test login
    print("\n--- Testing Login ---")
    login_data = json.dumps({
        "username": "testuser",
        "password": "password123"
    }).encode()
    req = urllib.request.Request(
        "http://localhost:8000/api/auth/login",
        data=login_data,
        headers={"Content-Type": "application/json"}
    )
    try:
        resp = urllib.request.urlopen(req)
        login_result = json.loads(resp.read().decode())
        print("✅ Login:", login_result.get("data", {}).get("access_token", "")[:20] + "...")
    except urllib.error.HTTPError as e:
        print("ℹ️  Login response:", e.code, e.read().decode())

    # Test Swagger docs
    print("\n--- Testing Swagger Docs ---")
    resp = urllib.request.urlopen("http://localhost:8000/docs")
    print("✅ Swagger available:", resp.status)

except urllib.error.URLError:
    print("❌ Backend not running at http://localhost:8000")
    print("Start it with:")
    print("  cd lifehub-backend")
    print('  C:\\Users\\rin\\.conda\\envs\\lifehub\\Scripts\\uvicorn app.main:app --reload')
