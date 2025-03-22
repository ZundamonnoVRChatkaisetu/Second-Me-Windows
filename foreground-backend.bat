@echo off
setlocal

:: Default environment variables
set VENV_NAME=second-me-venv
set LOCAL_APP_PORT=8002

:: Load environment variables from .env if exists
if exist .env (
    for /f "tokens=1,* delims==" %%a in (.env) do (
        if "%%a"=="VENV_NAME" set VENV_NAME=%%b
        if "%%a"=="LOCAL_APP_PORT" set LOCAL_APP_PORT=%%b
    )
)

echo.
echo  ================================================
echo    Second-Me Windows Backend (Foreground Mode)
echo  ================================================
echo.
echo This window will run the backend directly in this console.
echo Please start the frontend in a separate window.
echo.
echo Frontend startup command:
echo   cd lpm_frontend
echo   npm run dev
echo.
echo Browser URL: http://localhost:3000
echo.
echo Backend will run in this window. Press Ctrl+C to stop.
echo.
echo Starting backend...
echo ---------------------------------------------------
echo.

:: Check folder exists
if not exist logs mkdir logs

:: Check dependencies
call %VENV_NAME%\Scripts\activate.bat

:: Start backend (in foreground)
python app.py

:: Should not normally reach here
call %VENV_NAME%\Scripts\deactivate.bat
pause
