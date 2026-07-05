"""Run the backend server with auto-reload and proper window close handling.

Usage:
    python scripts/run_backend.py

This wraps uvicorn --reload in a subprocess so that clicking the window X
or pressing Ctrl+C will reliably kill the entire process tree.
"""
import os
import signal
import subprocess
import sys
import time
from pathlib import Path


def main():
    backend_dir = Path(__file__).resolve().parent.parent / "lifehub-backend"
    os.chdir(backend_dir)

    print("=" * 50)
    print("  LifeHub Backend (with auto-reload)")
    print("=" * 50)
    print()
    print(f"  URL:  http://localhost:8000")
    print(f"  Docs: http://localhost:8000/docs")
    print()
    print("  ✅ Hot-reload enabled: edit code, server auto-restarts")
    print("  ✅ Click X or Ctrl+C to stop cleanly")
    print()

    # Find python/uvicorn
    python = _find_python()
    if python is None:
        print("[ERROR] Could not find Python. Make sure conda env 'lifehub' is active.")
        input("Press Enter to exit...")
        return 1

    cmd = [python, "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]

    # Create process in a new process group so we can kill the whole tree
    proc = subprocess.Popen(
        cmd,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0,
    )

    try:
        proc.wait()
    except KeyboardInterrupt:
        _kill_proc_tree(proc)
    except SystemExit:
        _kill_proc_tree(proc)

    print()
    print("Server stopped.")
    input("Press Enter to exit...")
    return 0


def _find_python():
    """Try to find the Python executable (prefer conda env)."""
    # Check common conda paths
    user_profile = os.environ.get("USERPROFILE", "")
    candidates = [
        os.path.join(user_profile, ".conda", "envs", "lifehub", "python.exe"),
        os.path.join("C:\\", "ProgramData", "Miniconda3", "envs", "lifehub", "python.exe"),
        os.path.join("C:\\", "ProgramData", "Anaconda3", "envs", "lifehub", "python.exe"),
        os.path.join(user_profile, "Miniconda3", "envs", "lifehub", "python.exe"),
        os.path.join(user_profile, "Anaconda3", "envs", "lifehub", "python.exe"),
    ]
    for path in candidates:
        if os.path.isfile(path):
            return path

    # Fall back to PATH
    for path in os.environ.get("PATH", "").split(os.pathsep):
        candidate = os.path.join(path, "python.exe")
        if os.path.isfile(candidate):
            try:
                subprocess.run([candidate, "--version"], capture_output=True, check=True)
                return candidate
            except (subprocess.CalledProcessError, FileNotFoundError):
                continue

    return None


def _kill_proc_tree(proc):
    """Force kill the process and its children."""
    if proc.poll() is not None:
        return
    try:
        if sys.platform == "win32":
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                           capture_output=True, timeout=5)
        else:
            os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
    except Exception:
        proc.kill()


if __name__ == "__main__":
    sys.exit(main())
