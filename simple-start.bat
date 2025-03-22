@echo off
setlocal enabledelayedexpansion

echo.
echo  ================================================
echo    Second-Me Windows - Simple Direct Starter
echo  ================================================
echo.

:: Default environment variables
set VENV_NAME=second-me-venv
set BACKEND_PORT=8002
set FRONTEND_PORT=3000

:: Load environment variables from .env if exists
if exist .env (
    echo Loading environment variables from .env...
    for /f "tokens=1,* delims==" %%a in (.env) do (
        if "%%a"=="VENV_NAME" set VENV_NAME=%%b
        if "%%a"=="LOCAL_APP_PORT" set BACKEND_PORT=%%b
        if "%%a"=="LOCAL_FRONTEND_PORT" set FRONTEND_PORT=%%b
    )
)

:: Check if Python virtual environment exists
if not exist %VENV_NAME% (
    echo [ERROR] Python virtual environment not found.
    echo Please run setup.bat first.
    exit /b 1
)

:: Create necessary directories
if not exist logs mkdir logs
if not exist run mkdir run

:: Create .env file for frontend
echo [INFO] Setting up frontend environment...
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%BACKEND_PORT% > lpm_frontend\.env.local
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%BACKEND_PORT% > lpm_frontend\.env.development.local

:: Kill any existing processes (optional, could cause problems)
echo [INFO] Checking for any running services...
taskkill /f /fi "WINDOWTITLE eq Second-Me*" >nul 2>&1

:: Start Backend in a new command window
echo [INFO] Starting backend on port %BACKEND_PORT%...
start "Second-Me Backend" cmd /k "title Second-Me Backend && color 1f && %VENV_NAME%\Scripts\activate.bat && python app.py"

:: Wait for backend to start
echo [INFO] Waiting for backend to initialize...
timeout /t 5 /nobreak > nul

:: Start Frontend in a new command window
echo [INFO] Starting frontend on port %FRONTEND_PORT%...
cd lpm_frontend
start "Second-Me Frontend" cmd /k "title Second-Me Frontend && color 2f && npm run dev"
cd ..

:: Wait for frontend to start
echo [INFO] Waiting for frontend to initialize...
timeout /t 5 /nobreak > nul

:: Open browser
echo [INFO] Opening browser...
start http://localhost:%FRONTEND_PORT%

echo.
echo  ================================================
echo    Services started!
echo    Backend: http://localhost:%BACKEND_PORT%
echo    Frontend: http://localhost:%FRONTEND_PORT%
echo  ================================================
echo.
echo  To stop all services, close the command windows or run:
echo  taskkill /f /fi "WINDOWTITLE eq Second-Me*"
echo.
