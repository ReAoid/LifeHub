@echo off
cd /d "%~dp0.."
echo Starting LifeHub backend with hot-reload...
echo   URL:  http://localhost:8000
echo   Docs: http://localhost:8000/docs
echo.
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
