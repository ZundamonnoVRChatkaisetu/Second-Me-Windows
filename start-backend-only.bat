@echo off
setlocal enabledelayedexpansion

title Second-Me Backend Setup

echo.
echo  ================================================
echo    Second-Me Windows - Backend Only Setup
echo  ================================================
echo.

:: Default environment variables
set VENV_NAME=second-me-venv
set BACKEND_PORT=8002
set PYTHONIOENCODING=utf-8

:: Load environment variables from .env if exists
if exist .env (
    for /f "tokens=1,* delims==" %%a in (.env) do (
        if "%%a"=="VENV_NAME" set VENV_NAME=%%b
        if "%%a"=="LOCAL_APP_PORT" set BACKEND_PORT=%%b
    )
)

:: Export environment variables for Python
set LOCAL_APP_PORT=%BACKEND_PORT%

:: Check for required folders
if not exist logs mkdir logs
if not exist run mkdir run
if not exist models mkdir models
if not exist profiles mkdir profiles
if not exist uploads mkdir uploads
if not exist WorkSpace mkdir WorkSpace

:: Kill any existing backend processes
taskkill /f /fi "WINDOWTITLE eq Second-Me Backend" >nul 2>&1
if exist run\.backend.pid del /f run\.backend.pid >nul 2>&1

:: Check for port conflicts
netstat -ano | findstr ":%BACKEND_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [WARNING] Port %BACKEND_PORT% is in use. Attempting to free it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%BACKEND_PORT% " ^| findstr "LISTENING"') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)

:: Check for Python virtual environment
if not exist %VENV_NAME% (
    echo [INFO] Creating Python virtual environment...
    python -m venv %VENV_NAME%
    
    if not exist %VENV_NAME% (
        echo [ERROR] Failed to create Python virtual environment.
        echo [ERROR] Please make sure Python 3.10+ is installed and in your PATH.
        echo Press any key to exit...
        pause > nul
        exit /b 1
    )
)

:: Install required Python packages
echo [INFO] Activating Python virtual environment and installing packages...
call %VENV_NAME%\Scripts\activate.bat

echo Checking for Flask...
python -c "import flask" 2>nul
if %errorlevel% neq 0 (
    echo Installing Flask and related packages...
    pip install flask flask-cors python-dotenv
)

:: Confirm venv is activated
echo [INFO] Python environment: %VIRTUAL_ENV%

:: Start backend server with detailed output
echo [INFO] Starting Flask backend on port %BACKEND_PORT%...
echo.
echo  ================================================
echo    Backend starting... (Press Ctrl+C to stop)
echo  ================================================
echo.

python app.py
