@echo off
setlocal enabledelayedexpansion

echo.
echo  ================================================
echo    Second-Me Windows - All-In-One Starter
echo  ================================================
echo.

:: Default environment variables
set VENV_NAME=second-me-venv
set BACKEND_PORT=8002
set FRONTEND_PORT=3000

:: Load environment variables from .env if exists
if exist .env (
    for /f "tokens=1,* delims==" %%a in (.env) do (
        if "%%a"=="VENV_NAME" set VENV_NAME=%%b
        if "%%a"=="LOCAL_APP_PORT" set BACKEND_PORT=%%b
        if "%%a"=="LOCAL_FRONTEND_PORT" set FRONTEND_PORT=%%b
    )
)

:: 1. Check if folders exist
if not exist logs mkdir logs
if not exist run mkdir run

:: 2. Kill any existing processes
echo [1/6] Cleaning up existing processes...
taskkill /f /fi "WINDOWTITLE eq Second-Me Backend" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Second-Me Frontend" >nul 2>&1
if exist run\.backend.pid del /f run\.backend.pid >nul 2>&1
if exist run\.frontend.pid del /f run\.frontend.pid >nul 2>&1

:: 3. Check ports
echo [2/6] Checking for port conflicts...
netstat -ano | findstr ":%BACKEND_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [WARNING] Port %BACKEND_PORT% is in use. Attempting to free it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%BACKEND_PORT% " ^| findstr "LISTENING"') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)

netstat -ano | findstr ":%FRONTEND_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [WARNING] Port %FRONTEND_PORT% is in use. Attempting to free it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%FRONTEND_PORT% " ^| findstr "LISTENING"') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)

:: 4. Configure frontend to connect to backend
echo [3/6] Setting up backend connection...
if not exist lpm_frontend (
    echo [ERROR] Frontend directory not found!
    exit /b 1
)

:: Create .env file directly in Next.js app directory to ensure it's read
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%BACKEND_PORT% > lpm_frontend\.env
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%BACKEND_PORT% > lpm_frontend\.env.local
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%BACKEND_PORT% > lpm_frontend\.env.development
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%BACKEND_PORT% > lpm_frontend\.env.development.local

:: 5. Start backend in a new window
echo [4/6] Starting backend service...
start "Second-Me Backend" cmd /k "title Second-Me Backend && color 1f && echo Backend starting on port %BACKEND_PORT%... && echo. && %VENV_NAME%\Scripts\activate.bat && python app.py"

:: Wait for a moment to allow backend to initialize
echo [5/6] Waiting for backend to initialize...
timeout /t 5 /nobreak > nul

:: 6. Start frontend in a new window
echo [6/6] Starting frontend service...
cd lpm_frontend

:: Check dependencies
if not exist node_modules (
    echo [INFO] Installing frontend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install frontend dependencies.
        cd ..
        exit /b 1
    )
)

:: Start frontend
start "Second-Me Frontend" cmd /k "title Second-Me Frontend && color 2f && echo Frontend starting on port %FRONTEND_PORT%... && echo. && npm run dev"
cd ..

:: Open browser automatically
echo.
echo Starting browser...
timeout /t 5 /nobreak > nul
start http://localhost:%FRONTEND_PORT%

echo.
echo  ================================================
echo    All services started successfully!
echo  ================================================
echo.
echo  Backend: http://localhost:%BACKEND_PORT%
echo  Frontend: http://localhost:%FRONTEND_PORT%
echo.
echo  To stop all services, close the command windows or run:
echo  taskkill /f /fi "WINDOWTITLE eq Second-Me*"
echo.
