"""Simple API test script."""
import json
import urllib.request

BASE = "http://localhost:8000"

def req(method, path, data=None, token=None):
    url = f"{BASE}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    r = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(r)
        return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return {"error": e.code, "body": e.read().decode(errors="replace")[:500]}

print("=" * 60)
print("  LIFEHUB BACKEND API TEST")
print("=" * 60)

# 1. Health
r = req("GET", "/api/health")
print(f"\n[1] Health: {'OK' if r.get('code') == 0 else 'FAIL'}")
print(f"    {json.dumps(r, ensure_ascii=False)}")

# 2. Register
print(f"\n[2] Register...")
r = req("POST", "/api/auth/register", {"username": "testuser", "email": "test@example.com", "password": "password123"})
print(f"    {json.dumps(r, ensure_ascii=False)}")

# 3. Login
print(f"\n[3] Login...")
r = req("POST", "/api/auth/login", {"username": "testuser", "password": "password123"})
token = ""
if r.get("code") == 0:
    token = r["data"]["access_token"]
    print(f"    Token: {token[:30]}...")
else:
    print(f"    FAILED: {r}")
    
# 4. Tags (with auth)
if token:
    print(f"\n[4] Tags List...")
    r = req("GET", "/api/tags", token=token)
    print(f"    {json.dumps(r, ensure_ascii=False)}")
    
    print(f"\n[5] Create Tag...")
    r = req("POST", "/api/tags", {"name": "important", "color": "#ef4444"}, token=token)
    print(f"    {json.dumps(r, ensure_ascii=False)}")

print("\n" + "=" * 60)
if token:
    print("  ALL TESTS COMPLETE")
else:
    print("  Tests incomplete - see errors above")
print("=" * 60)
