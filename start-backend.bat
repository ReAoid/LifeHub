@echo off
title LifeHub Backend

echo ============================================
echo   LifeHub Backend - Starting...
echo ============================================
echo.

cd /d "%~dp0lifehub-backend"

:: ----- Find Python (try multiple methods) -----
set PYTHON=

:: Method 1: Try 'python' in PATH
python --version >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON=python
    goto :found_python
)

:: Method 2: Try 'python3' in PATH
python3 --version >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON=python3
    goto :found_python
)

:: Method 3: Try conda (find it first)
where conda >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Found conda, looking for 'lifehub' environment...
    for /f "tokens=2 delims= " %%a in ('conda run -n lifehub python --version 2^>nul') do set PYTHON_VER=%%a
    if defined PYTHON_VER (
        set PYTHON=conda run -n lifehub python
        set UVICORN=conda run -n lifehub uvicorn
        goto :found_python
    )
)

:: Method 4: Try common conda user install path
set CONDA_USER_PATH=%USERPROFILE%\.conda\envs\lifehub
if exist "%CONDA_USER_PATH%\python.exe" (
    echo [INFO] Found conda env at: %CONDA_USER_PATH%
    set PYTHON=%CONDA_USER_PATH%\python.exe
    set UVICORN=%CONDA_USER_PATH%\Scripts\uvicorn.exe
    goto :found_python
)

:: Method 5: Try common conda system install paths
for %%p in (
    "C:\ProgramData\Miniconda3\envs\lifehub"
    "C:\ProgramData\Anaconda3\envs\lifehub"
    "C:\Users\%USERNAME%\Miniconda3\envs\lifehub"
    "C:\Users\%USERNAME%\Anaconda3\envs\lifehub"
    "C:\Miniconda3\envs\lifehub"
    "C:\Anaconda3\envs\lifehub"
) do (
    if exist "%%~p\python.exe" (
        echo [INFO] Found conda env at: %%~p
        set PYTHON=%%~p\python.exe
        set UVICORN=%%~p\Scripts\uvicorn.exe
        goto :found_python
    )
)

:: Not found
echo [ERROR] Could not find Python or conda environment 'lifehub'.
echo.
echo   Please make sure Python 3.12+ is installed and available.
echo.
echo   Option A - Poetry (recommended):
echo     cd lifehub-backend
echo     poetry install
echo     poetry run uvicorn app.main:app --reload
echo.
echo   Option B - Conda:
echo     conda create -n lifehub python=3.12
echo     conda activate lifehub
echo     cd lifehub-backend
echo     pip install poetry
echo     poetry install
echo.
pause
exit /b 1

:found_python
echo [INFO] Using Python: %PYTHON%
if not "%UVICORN%"=="" (
    echo [INFO] Using uvicorn: %UVICORN%
)

:: Check .env
if not exist ".env" (
    echo [WARN] .env file not found, using defaults
)

echo.
echo ============================================
echo   Server is running!
echo.
echo     URL:  http://localhost:8000
echo     Docs: http://localhost:8000/docs
echo.
echo   To STOP:  Press Ctrl+C in this window
echo   (then press any key to close)
echo ============================================
echo.

:: Start server with auto-reload (proper window close handling)
%PYTHON% "%~dp0scripts\run_backend.py"

echo.
echo ============================================
echo   Server has stopped.
echo   Close this window or press any key to exit.
echo ============================================
echo.
pause
