@echo off
setlocal enabledelayedexpansion

title Second-Me Windows Setup and Launch

echo.
echo  ================================================
echo    Second-Me Windows - Advanced Setup and Launch
echo  ================================================
echo.

:: Default environment variables
set VENV_NAME=second-me-venv
set BACKEND_PORT=8002
set FRONTEND_PORT=3000
set CORS_PORT=8003
set PYTHONIOENCODING=utf-8

:: Load environment variables from .env if exists
if exist .env (
    for /f "tokens=1,* delims==" %%a in (.env) do (
        if "%%a"=="VENV_NAME" set VENV_NAME=%%b
        if "%%a"=="LOCAL_APP_PORT" set BACKEND_PORT=%%b
        if "%%a"=="LOCAL_FRONTEND_PORT" set FRONTEND_PORT=%%b
    )
)

:: Export environment variables for Node.js and Python
set NODE_ENV=development
set BACKEND_PORT=%BACKEND_PORT%
set CORS_PORT=%CORS_PORT%
set LOCAL_APP_PORT=%BACKEND_PORT%

:: 1. Check for required folders
if not exist logs mkdir logs
if not exist run mkdir run
if not exist models mkdir models
if not exist profiles mkdir profiles
if not exist uploads mkdir uploads
if not exist WorkSpace mkdir WorkSpace

:: Clear log files
if exist logs\backend.log del /f logs\backend.log
if exist logs\cors-proxy.log del /f logs\cors-proxy.log

:: 2. Kill any existing processes
echo [1/9] Cleaning up existing processes...
taskkill /f /fi "WINDOWTITLE eq Second-Me Backend" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Second-Me Frontend" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Second-Me CORS Proxy" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Second-Me Services" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Second-Me Windows Setup and Launch" >nul 2>&1
if exist run\.backend.pid del /f run\.backend.pid >nul 2>&1
if exist run\.frontend.pid del /f run\.frontend.pid >nul 2>&1

:: 3. Check for port conflicts
echo [2/9] Checking for port conflicts...
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

:: 4. Check for Python virtual environment
echo [3/9] Checking Python virtual environment...
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

:: 5. Install required Python packages
echo [4/9] Installing required Python packages...
call %VENV_NAME%\Scripts\activate.bat

echo Checking for Flask...
python -c "import flask" 2>nul
if %errorlevel% neq 0 (
    echo Installing Flask and related packages...
    pip install flask flask-cors python-dotenv 
)

:: 6. Set up backend URL for frontend
echo [5/9] Setting up frontend configuration...
if not exist lpm_frontend (
    echo [ERROR] Frontend directory not found!
    echo Press any key to exit...
    pause > nul
    exit /b 1
)

:: Create .env files to point to the CORS proxy
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%CORS_PORT% > lpm_frontend\.env
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%CORS_PORT% > lpm_frontend\.env.local
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%CORS_PORT% > lpm_frontend\.env.development
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%CORS_PORT% > lpm_frontend\.env.development.local

:: 7. Update CORS proxy file
echo [6/9] Preparing frontend dependencies...
cd lpm_frontend

:: Make sure node dependencies are installed
if not exist node_modules (
    echo [INFO] Installing Node.js dependencies...
    call npm install
) else (
    echo [INFO] Node.js dependencies already installed.
)

:: Check specifically for express and http-proxy-middleware
if not exist node_modules\express (
    echo [INFO] Installing additional dependencies...
    call npm install express http-proxy-middleware cors
)

:: Create the better runner script
echo @echo off > run-all-services.bat
echo setlocal enabledelayedexpansion >> run-all-services.bat
echo set PYTHONIOENCODING=utf-8 >> run-all-services.bat
echo set LOCAL_APP_PORT=%BACKEND_PORT% >> run-all-services.bat
echo. >> run-all-services.bat
echo echo. >> run-all-services.bat
echo echo Starting all Second Me services... >> run-all-services.bat
echo echo. >> run-all-services.bat
echo echo [1/3] Starting backend on port %BACKEND_PORT%... >> run-all-services.bat
echo. >> run-all-services.bat

:: Use more robust Python activation and error handling
echo if exist ..\%VENV_NAME%\Scripts\activate.bat ( >> run-all-services.bat
echo   call ..\%VENV_NAME%\Scripts\activate.bat >> run-all-services.bat
echo   cd .. >> run-all-services.bat
echo   echo Starting Flask backend... >> run-all-services.bat
echo   start /min cmd /k "title Second-Me Backend ^&^& color 1f ^&^& set PYTHONIOENCODING=utf-8 ^&^& set LOCAL_APP_PORT=%BACKEND_PORT% ^&^& python app.py 2^>logs\backend.log" >> run-all-services.bat
echo   cd lpm_frontend >> run-all-services.bat
echo ) else ( >> run-all-services.bat
echo   echo [ERROR] Python virtual environment not found. >> run-all-services.bat
echo   exit /b 1 >> run-all-services.bat
echo ) >> run-all-services.bat
echo. >> run-all-services.bat
echo echo Backend started. >> run-all-services.bat
echo echo. >> run-all-services.bat
echo timeout /t 8 /nobreak >> run-all-services.bat
echo. >> run-all-services.bat

:: CORS proxy setup
echo echo [2/3] Starting CORS proxy on port %CORS_PORT%... >> run-all-services.bat
echo. >> run-all-services.bat
echo if exist public\cors-anywhere.js ( >> run-all-services.bat
echo   start /min cmd /k "title Second-Me CORS Proxy ^&^& color 5f ^&^& node public/cors-anywhere.js 2^>logs\cors-proxy.log" >> run-all-services.bat
echo ) else ( >> run-all-services.bat
echo   echo [ERROR] CORS proxy script not found. >> run-all-services.bat
echo   exit /b 1 >> run-all-services.bat
echo ) >> run-all-services.bat
echo. >> run-all-services.bat
echo echo CORS proxy started. >> run-all-services.bat
echo echo. >> run-all-services.bat
echo timeout /t 3 /nobreak >> run-all-services.bat
echo. >> run-all-services.bat

:: Frontend setup
echo echo [3/3] Starting frontend on port %FRONTEND_PORT%... >> run-all-services.bat
echo echo Starting Next.js development server... >> run-all-services.bat
echo echo. >> run-all-services.bat
echo call npm run dev >> run-all-services.bat

:: 8. Start the integrated service
echo [7/9] Starting all services...
start "Second-Me Services" cmd /c run-all-services.bat

cd ..

:: 9. Wait for services to initialize
echo [8/9] Waiting for services to initialize...
echo     This might take up to 30 seconds...
timeout /t 20 /nobreak > nul

:: Show verbose status
echo [9/9] Checking service status...

:: Check backend status
echo Checking backend status...
netstat -ano | findstr ":%BACKEND_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Backend is running on port %BACKEND_PORT%.
) else (
    echo [WARNING] Backend may not be running. Check logs\backend.log for details.
)

:: Check CORS proxy status
echo Checking CORS proxy status...
netstat -ano | findstr ":%CORS_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] CORS proxy is running on port %CORS_PORT%.
) else (
    echo [WARNING] CORS proxy may not be running. Check logs\cors-proxy.log for details.
)

:: Check frontend status
echo Checking frontend status...
netstat -ano | findstr ":%FRONTEND_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Frontend is running on port %FRONTEND_PORT%.
) else (
    echo [WARNING] Frontend may not be running properly.
)

:: Start browser with a delay to ensure all services are ready
echo Starting browser...
timeout /t 3 /nobreak > nul
start http://localhost:%FRONTEND_PORT%

echo.
echo  ================================================
echo    Second-Me Windows has been launched!
echo  ================================================
echo.
echo  Service URLs:
echo    - Backend API: http://localhost:%BACKEND_PORT%
echo    - CORS Proxy: http://localhost:%CORS_PORT%
echo    - Frontend UI: http://localhost:%FRONTEND_PORT%
echo.
echo  Log Files:
echo    - Backend: logs\backend.log
echo    - CORS proxy: logs\cors-proxy.log
echo.
echo  To stop all services: taskkill /f /fi "WINDOWTITLE eq Second-Me*"
echo.
echo  If you encounter any issues, please check the log files
echo  or refer to TROUBLESHOOTING.md for help.
echo.
