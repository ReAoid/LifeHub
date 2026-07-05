@echo off
title LifeHub Frontend

echo ============================================
echo   LifeHub Frontend - Starting...
echo ============================================
echo.

cd /d "%~dp0lifehub-web"

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js 20+
    pause
    exit /b 1
)

:: Check npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm not found
    pause
    exit /b 1
)

:: Install dependencies if needed
if not exist "node_modules" (
    echo [INFO] Installing frontend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Dependency installation failed
        pause
        exit /b 1
    )
) else (
    echo [INFO] Dependencies ready
)

echo.
echo ============================================
echo   Frontend is running!
echo.
echo     URL: http://localhost:5173
echo.
echo   Make sure backend is also running
echo   (run start-backend.bat in another window)
echo.
echo   To STOP: Ctrl+C, then press any key
echo ============================================
echo.

npx vite --host

echo.
echo ============================================
echo   Frontend has stopped.
echo ============================================
pause
