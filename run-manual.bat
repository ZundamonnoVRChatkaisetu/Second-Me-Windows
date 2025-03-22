@echo off
setlocal

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

echo.
echo  ================================================
echo    Second-Me Windows - Manual Run Helper
echo  ================================================
echo.
echo This script provides instructions to run each component manually.
echo.
echo 1. First clean up any existing processes:
echo    - Run: fix-permissions.bat
echo.
echo 2. To run the backend:
echo    - Open a new command prompt window
echo    - Run the following commands:
echo      cd %cd%
echo      %VENV_NAME%\Scripts\activate.bat
echo      python app.py
echo.
echo 3. To run the frontend:
echo    - Open another command prompt window
echo    - Run the following commands:
echo      cd %cd%\lpm_frontend
echo      npm run dev
echo.
echo 4. Open your browser to:
echo    http://localhost:%FRONTEND_PORT%
echo.
echo Each component will run in its own window, making it easier to 
echo see any errors that might occur during startup.
echo.
echo Press any key to exit...

pause > nul
