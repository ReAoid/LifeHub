@echo off
title LifeHub Backend

cd /d "%~dp0.."

echo.
echo ============================================
echo   LifeHub Backend
echo   URL:  http://localhost:8000
echo   Docs: http://localhost:8000/docs
echo ============================================
echo.
echo   Press Ctrl+C to stop
echo.

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
