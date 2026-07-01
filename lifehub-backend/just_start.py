"""Simple startup that just works."""
import subprocess
import time

backend_dir = r"E:\DevelopmentEnvironment\Python\project\LifeHub\lifehub-backend"
uvicorn_exe = r"C:\Users\rin\.conda\envs\lifehub\Scripts\uvicorn.exe"

print("Starting server...")
p = subprocess.Popen(
    [uvicorn_exe, "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
    cwd=backend_dir,
)
time.sleep(5)
print(f"Server PID: {p.pid}")
print("Done! Run tests with: python test_api.py")
