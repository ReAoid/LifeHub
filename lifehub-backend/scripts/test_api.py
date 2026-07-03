"""Test all APIs — assumes the server is already running on port 8000.

Usage:
    # First start the server:
    python scripts/start_dev.py

    # Then in another terminal:
    python scripts/test_api.py
"""
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
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())
    except urllib.error.URLError:
        return 0, {"error": "Cannot connect to server. Is it running?"}


def test():
    print("=" * 60)
    print("  LIFEHUB BACKEND API TEST")
    print("=" * 60)

    # 1. Health
    status, data = req("GET", "/api/health")
    print(f"\n[1] Health Check")
    if status == 200 and data.get("code") == 0:
        print(f"    ✅ OK — {json.dumps(data, ensure_ascii=False)}")
    else:
        print(f"    ❌ FAIL ({status}) — {data}")
        if status == 0:
            return

    # 2. Register
    print(f"\n[2] Register User")
    status, data = req("POST", "/api/auth/register",
                       {"username": "testuser", "email": "test@example.com", "password": "password123"})
    if status == 200:
        print(f"    ✅ OK — user registered")
    elif status == 409:
        print(f"    ⚠️ User already exists (expected on re-run)")
    else:
        print(f"    ❌ FAIL ({status}) — {data}")

    # 3. Login
    print(f"\n[3] Login")
    status, data = req("POST", "/api/auth/login",
                       {"username": "testuser", "password": "password123"})
    token = ""
    if status == 200:
        token = data.get("data", {}).get("access_token", "")
        print(f"    ✅ OK — token: {token[:30]}...")
    else:
        print(f"    ❌ FAIL ({status}) — {data}")
        return

    # 4. Tags (authenticated)
    print(f"\n[4] List Tags")
    status, data = req("GET", "/api/tags", token=token)
    if status == 200:
        tags = data.get("data", [])
        print(f"    ✅ OK — {len(tags)} tags: {json.dumps(tags, ensure_ascii=False)}")
    else:
        print(f"    ❌ FAIL ({status}) — {data}")

    print(f"\n[5] Create Tag")
    status, data = req("POST", "/api/tags", {"name": "important", "color": "#ef4444"}, token=token)
    if status == 200:
        tag_id = data.get("data", {}).get("id", "")
        print(f"    ✅ OK — created tag id={tag_id[:8]}...")
    else:
        print(f"    ❌ FAIL ({status}) — {data}")

    print(f"\n[6] Get Tag")
    if status == 200:
        tag_id = data.get("data", {}).get("id", "")
        status2, data2 = req("GET", f"/api/tags/{tag_id}", token=token)
        if status2 == 200:
            print(f"    ✅ OK — {json.dumps(data2, ensure_ascii=False)}")
        else:
            print(f"    ❌ FAIL ({status2}) — {data2}")

    print(f"\n[7] Delete Tag")
    if status == 200:
        tag_id = data.get("data", {}).get("id", "")
        status2, data2 = req("DELETE", f"/api/tags/{tag_id}", token=token)
        print(f"    {'✅ OK' if status2 == 200 else '❌ FAIL'} ({status2})")

    print("\n" + "=" * 60)
    print("  TESTS COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    test()
