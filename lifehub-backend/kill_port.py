"""Kill all processes on port 8000."""
import subprocess

result = subprocess.run(['netstat', '-ano'], capture_output=True, text=True)
found = False
for line in result.stdout.splitlines():
    if ':8000' in line and 'LISTENING' in line:
        pid = line.strip().split()[-1]
        subprocess.run(['taskkill', '/F', '/PID', pid], capture_output=True)
        print(f'Killed PID {pid} on port 8000')
        found = True
if not found:
    print('No process on port 8000')
