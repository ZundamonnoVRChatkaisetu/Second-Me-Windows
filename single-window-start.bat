@echo off
setlocal enabledelayedexpansion

echo.
echo  ================================================
echo    Second-Me Windows - Single Window Start
echo  ================================================
echo.

:: Default environment variables
set VENV_NAME=second-me-venv
set BACKEND_PORT=8002
set FRONTEND_PORT=3000
set CORS_PORT=8003

:: Load environment variables from .env if exists
if exist .env (
    for /f "tokens=1,* delims==" %%a in (.env) do (
        if "%%a"=="VENV_NAME" set VENV_NAME=%%b
        if "%%a"=="LOCAL_APP_PORT" set BACKEND_PORT=%%b
        if "%%a"=="LOCAL_FRONTEND_PORT" set FRONTEND_PORT=%%b
    )
)

:: Export environment variables for Node.js
set NODE_ENV=development
set BACKEND_PORT=%BACKEND_PORT%
set CORS_PORT=%CORS_PORT%

:: 1. Check for required folders
if not exist logs mkdir logs
if not exist run mkdir run

:: 2. Kill any existing processes
echo [1/7] Cleaning up existing processes...
taskkill /f /fi "WINDOWTITLE eq Second-Me Backend" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Second-Me Frontend" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Second-Me CORS Proxy" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Second-Me Services" >nul 2>&1
if exist run\.backend.pid del /f run\.backend.pid >nul 2>&1
if exist run\.frontend.pid del /f run\.frontend.pid >nul 2>&1

:: 3. Check for port conflicts
echo [2/7] Checking for port conflicts...
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

netstat -ano | findstr ":%CORS_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [WARNING] Port %CORS_PORT% is in use. Attempting to free it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%CORS_PORT% " ^| findstr "LISTENING"') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)

:: 4. Set up backend URL
echo [3/7] Setting up backend connection via CORS proxy...
if not exist lpm_frontend (
    echo [ERROR] Frontend directory not found!
    exit /b 1
)

:: Create .env files to point to the CORS proxy
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%CORS_PORT% > lpm_frontend\.env
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%CORS_PORT% > lpm_frontend\.env.local
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%CORS_PORT% > lpm_frontend\.env.development
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%CORS_PORT% > lpm_frontend\.env.development.local

:: 5. Update CORS proxy file if necessary
echo [4/7] Checking CORS proxy script...
cd lpm_frontend

:: Make sure dependencies are installed
if not exist node_modules\express (
    echo [INFO] Installing required dependencies...
    call npm install express http-proxy-middleware cors
)

:: Create the single window batch file
echo @echo off > run-all-services.bat
echo echo Starting all Second Me services... >> run-all-services.bat
echo echo. >> run-all-services.bat
echo echo [1/3] Starting backend on port %BACKEND_PORT%... >> run-all-services.bat
echo start /min cmd /c "cd .. && %VENV_NAME%\Scripts\activate.bat && python app.py > logs\backend.log 2>&1" >> run-all-services.bat
echo echo Backend started in background. >> run-all-services.bat
echo echo. >> run-all-services.bat
echo timeout /t 5 /nobreak > nul >> run-all-services.bat
echo echo [2/3] Starting CORS proxy on port %CORS_PORT%... >> run-all-services.bat
echo start /min cmd /c "node public/cors-anywhere.js > logs\cors-proxy.log 2>&1" >> run-all-services.bat
echo echo CORS proxy started in background. >> run-all-services.bat
echo echo. >> run-all-services.bat
echo timeout /t 3 /nobreak > nul >> run-all-services.bat
echo echo [3/3] Starting frontend on port %FRONTEND_PORT%... >> run-all-services.bat
echo echo Starting Next.js development server... >> run-all-services.bat
echo call npm run dev >> run-all-services.bat

echo [5/7] Starting all services in a single window...
start "Second-Me Services" cmd /c run-all-services.bat

cd ..

:: Open browser automatically
echo [6/7] Waiting for services to initialize...
echo     This might take up to 30 seconds...
timeout /t 15 /nobreak > nul

echo [7/7] Starting browser...
start http://localhost:%FRONTEND_PORT%

echo.
echo  ================================================
echo    All services started in background!
echo  ================================================
echo.
echo  To stop all services: taskkill /f /fi "WINDOWTITLE eq Second-Me*"
echo.
echo  Service URLs:
echo    Backend: http://localhost:%BACKEND_PORT%
echo    CORS Proxy: http://localhost:%CORS_PORT%
echo    Frontend: http://localhost:%FRONTEND_PORT%
echo.
echo  Log files:
echo    Backend: logs\backend.log
echo    CORS proxy: logs\cors-proxy.log
echo.
echo  If you encounter any issues, please check the log files
echo  or refer to TROUBLESHOOTING.md for help.
echo.
