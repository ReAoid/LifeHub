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
echo   Click X or press Ctrl+C to stop
echo.

:: --reload 会导致窗口关闭按钮卡死，去掉后可直接关窗
uvicorn app.main:app --host 0.0.0.0 --port 8000

pause
