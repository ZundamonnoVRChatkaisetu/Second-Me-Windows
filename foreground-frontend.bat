@echo off
setlocal

:: Default environment variables
set LOCAL_FRONTEND_PORT=3000

:: Load environment variables from .env if exists
if exist .env (
    for /f "tokens=1,* delims==" %%a in (.env) do (
        if "%%a"=="LOCAL_FRONTEND_PORT" set LOCAL_FRONTEND_PORT=%%b
    )
)

echo.
echo  ================================================
echo    Second-Me Windows Frontend (Foreground Mode)
echo  ================================================
echo.
echo This window will run the frontend directly in this console.
echo Please start the backend in a separate window.
echo.
echo Backend startup command:
echo   foreground-backend.bat
echo.
echo Starting frontend...
echo ---------------------------------------------------
echo.

:: Check directory
if not exist lpm_frontend (
    echo [ERROR] lpm_frontend directory not found.
    exit /b 1
)

:: Change to frontend directory
cd lpm_frontend

:: Check dependencies
if not exist node_modules (
    echo node_modules not found. Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        cd ..
        exit /b 1
    )
)

:: Start frontend (in foreground)
npm run dev

:: Should not normally reach here
cd ..
pause
