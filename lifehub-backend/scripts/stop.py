"""Force-stop the LifeHub backend server by killing the process on port 8000."""

import os
import signal
import subprocess
import sys
import time


def get_pid_by_port(port: int = 8000) -> int | None:
    """Get the PID of the process listening on the given port."""
    result = subprocess.run(
        ["netstat", "-ano"], capture_output=True, text=True
    )
    for line in result.stdout.splitlines():
        if f":{port}" in line and "LISTENING" in line:
            parts = line.strip().split()
            if parts:
                return int(parts[-1])
    return None


def kill_process_tree(pid: int) -> bool:
    """Kill a process and all its children."""
    try:
        # First try graceful termination
        subprocess.run(
            ["taskkill", "/T", "/PID", str(pid)],
            capture_output=True, text=True,
        )
        time.sleep(1)

        # Force kill if still running
        subprocess.run(
            ["taskkill", "/F", "/T", "/PID", str(pid)],
            capture_output=True, text=True,
        )
        return True
    except Exception:
        return False


def main():
    print("=" * 50)
    print("  Stopping LifeHub Backend")
    print("=" * 50)
    print()

    port = 8000
    pid = get_pid_by_port(port)

    if pid is None:
        print(f"[INFO] No process found listening on port {port}.")
        print()
        # Fallback: try killing any python/uvicorn process
        print("  Checking for orphaned uvicorn processes...")
        result = subprocess.run(
            ["tasklist", "/FI", "IMAGENAME eq python.exe", "/FO", "CSV", "/NH"],
            capture_output=True, text=True,
        )
        killed_any = False
        for line in result.stdout.splitlines():
            if "uvicorn" in line.lower():
                parts = line.strip('"').split('","')
                if len(parts) >= 2:
                    try:
                        pid = int(parts[1])
                        print(f"  Killing orphaned python.exe (PID={pid})...")
                        subprocess.run(["taskkill", "/F", "/PID", str(pid)], capture_output=True)
                        killed_any = True
                    except ValueError:
                        pass
        if killed_any:
            print("  [OK] Orphaned processes cleaned up.")
        else:
            print("  No orphaned processes found.")
    else:
        print(f"  Found process PID={pid} listening on port {port}")
        print(f"  Killing process tree...")
        if kill_process_tree(pid):
            print(f"  [OK] Process tree killed successfully.")
        else:
            print(f"  [FAILED] Could not kill process.")
            print()
            print("  Try running as Administrator, or manually run:")
            print(f"    taskkill /F /PID {pid}")

    print()
    print("Done.")
    input("Press Enter to exit...")


if __name__ == "__main__":
    main()
