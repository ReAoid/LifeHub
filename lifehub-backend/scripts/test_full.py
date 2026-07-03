"""Full integration test: start server → test all APIs → show output.

Usage:
    python scripts/test_full.py
"""
import json
import os
import subprocess
import time
import urllib.request
import urllib.error
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
LOGFILE = BACKEND_DIR / "logs" / "full_test.log"


def clean_db():
    """Remove old database files for a clean test."""
    for f in ["lifehub.db", "lifehub.db-wal", "lifehub.db-shm"]:
        p = BACKEND_DIR / f
        if p.exists():
            p.unlink()
            print(f"  Removed {f}")


def start_server():
    """Start uvicorn and return the process."""
    logfile_path = str(LOGFILE)
    with open(logfile_path, "w", encoding="utf-8") as f:
        p = subprocess.Popen(
            ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
            cwd=BACKEND_DIR,
            stdout=f,
            stderr=subprocess.STDOUT,
        )
    print(f"  Server PID: {p.pid}")
    return p


def call(method, path, data=None, token=None):
    """Make an HTTP request and return (status, parsed_json)."""
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


def main():
    print("=" * 60)
    print("  FULL INTEGRATION TEST")
    print("=" * 60)

    # Clean
    print("\n[Setup] Cleaning old database...")
    clean_db()

    # Start server
    print("[Setup] Starting server...")
    server_proc = start_server()
    time.sleep(5)

    token = ""
    tests_passed = 0
    tests_failed = 0

    def test(name, condition, detail=""):
        nonlocal tests_passed, tests_failed
        if condition:
            tests_passed += 1
            print(f"  ✅ {name} — {detail}" if detail else f"  ✅ {name}")
        else:
            tests_failed += 1
            print(f"  ❌ {name}" + (f" — {detail}" if detail else ""))

    # 1. Health
    status, data = call("GET", "/api/health")
    test("Health Check", status == 200, json.dumps(data, ensure_ascii=False))

    # 2. Register
    status, data = call("POST", "/api/auth/register",
                        {"username": "demo", "email": "demo@lifehub.app", "password": "demo123"})
    test("Register", status == 200, f"user={data.get('data', {}).get('username', '?')}")

    # 3. Login
    status, data = call("POST", "/api/auth/login",
                        {"username": "demo", "password": "demo123"})
    token = data.get("data", {}).get("access_token", "")
    test("Login", status == 200 and bool(token), f"token={token[:20]}...")

    # 4-6. Tags CRUD (authenticated)
    if token:
        status, data = call("GET", "/api/tags", token=token)
        test("List Tags", status == 200, f"{len(data.get('data', []))} tags")

        status, data = call("POST", "/api/tags",
                            {"name": "important", "color": "#ef4444"}, token=token)
        tag_id = data.get("data", {}).get("id", "")
        test("Create Tag", status == 200 and bool(tag_id), f"id={tag_id[:8]}...")

        if tag_id:
            status, data = call("GET", f"/api/tags/{tag_id}", token=token)
            test("Get Tag by ID", status == 200,
                 f"name={data.get('data', {}).get('name', '?')}")

            status, data = call("DELETE", f"/api/tags/{tag_id}", token=token)
            test("Delete Tag", status == 200)

        # Profile
        status, data = call("GET", "/api/users/profile", token=token)
        test("Get Profile", status == 200,
             f"user={data.get('data', {}).get('username', '?')}")

    # 7. Swagger docs
    status, _ = call("GET", "/docs")
    test("Swagger Docs", status == 200)

    # Summary
    print(f"\n{'=' * 60}")
    total = tests_passed + tests_failed
    print(f"  RESULTS: {tests_passed}/{total} passed"
          + ("" if tests_failed == 0 else f", {tests_failed} failed"))
    print(f"  Log file: {LOGFILE}")
    print(f"{'=' * 60}")

    # Show last 10 lines of log if any failure
    if tests_failed > 0:
        if LOGFILE.exists():
            with open(LOGFILE, encoding="utf-8") as f:
                lines = f.readlines()
            print(f"\n--- Last {min(20, len(lines))} lines of log ---")
            for line in lines[-20:]:
                if "ERROR" in line or "Traceback" in line or "Error" in line:
                    print(f"  {line.rstrip()}")

    # Keep server running so user can inspect
    print(f"\nServer still running (PID: {server_proc.pid}).")
    print("Press Ctrl+C to stop, or run: python scripts/kill_port.py")
    try:
        server_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server_proc.terminate()
        server_proc.wait()


if __name__ == "__main__":
    main()
