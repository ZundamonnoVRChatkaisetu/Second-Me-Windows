@echo off
setlocal

echo.
echo  ================================================
echo    Second-Me Windows - Backend Connection Fix
echo  ================================================
echo.

echo This script will add or update your frontend configuration 
echo to connect to the backend running on port 8002.
echo.

if not exist lpm_frontend (
    echo [ERROR] Frontend directory not found!
    exit /b 1
)

echo [INFO] Setting up backend connection...

:: Create .env.local file with backend URL
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:8002 > lpm_frontend\.env.local

echo [SUCCESS] Configuration file created: lpm_frontend\.env.local
echo.
echo Please restart your frontend with:
echo   foreground-frontend.bat
echo.
echo After restarting, reload the page in your browser.
echo.

pause
