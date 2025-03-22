@echo off
setlocal enabledelayedexpansion

echo.
echo  ================================================
echo    Second-Me Windows - Start with CORS Proxy
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

:: Export environment variables for the Node.js proxy
set NODE_ENV=production
set BACKEND_PORT=%BACKEND_PORT%
set CORS_PORT=%CORS_PORT%

:: 1. Check if folders exist
if not exist logs mkdir logs
if not exist run mkdir run

:: 2. Kill any existing processes
echo [1/7] Cleaning up existing processes...
taskkill /f /fi "WINDOWTITLE eq Second-Me Backend" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Second-Me Frontend" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Second-Me CORS Proxy" >nul 2>&1
if exist run\.backend.pid del /f run\.backend.pid >nul 2>&1
if exist run\.frontend.pid del /f run\.frontend.pid >nul 2>&1

:: 3. Check ports
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

:: 4. Configure frontend to connect to CORS proxy instead of backend directly
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

:: 5. Start backend in a new window
echo [4/7] Starting backend service...
start "Second-Me Backend" cmd /k "title Second-Me Backend && color 1f && echo Backend starting on port %BACKEND_PORT%... && echo. && %VENV_NAME%\Scripts\activate.bat && python app.py"

:: Wait for a moment to allow backend to initialize
echo [5/7] Waiting for backend to initialize...
timeout /t 5 /nobreak > nul

:: 6. Start CORS proxy
echo [6/7] Starting CORS proxy...
cd lpm_frontend

:: Make sure http-proxy-middleware is installed
if not exist node_modules\express (
    echo [INFO] Installing required dependencies...
    call npm install express http-proxy-middleware cors
)

:: Create CORS proxy entry point if it doesn't exist
if not exist public\cors-anywhere.js (
    echo [ERROR] CORS proxy script not found!
    echo Creating a basic CORS proxy script...
    
    mkdir public 2>nul
    
    echo const express = require('express'); > public\cors-anywhere.js
    echo const { createProxyMiddleware } = require('http-proxy-middleware'); >> public\cors-anywhere.js
    echo. >> public\cors-anywhere.js
    echo const BACKEND_PORT = process.env.BACKEND_PORT || 8002; >> public\cors-anywhere.js
    echo const CORS_PORT = process.env.CORS_PORT || 8003; >> public\cors-anywhere.js
    echo. >> public\cors-anywhere.js
    echo const app = express(); >> public\cors-anywhere.js
    echo. >> public\cors-anywhere.js
    echo app.use((req, res, next) =^> { >> public\cors-anywhere.js
    echo   res.header('Access-Control-Allow-Origin', '*'); >> public\cors-anywhere.js
    echo   res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS'); >> public\cors-anywhere.js
    echo   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization'); >> public\cors-anywhere.js
    echo   next(); >> public\cors-anywhere.js
    echo }); >> public\cors-anywhere.js
    echo. >> public\cors-anywhere.js
    echo app.use('/', createProxyMiddleware({ >> public\cors-anywhere.js
    echo   target: `http://localhost:${BACKEND_PORT}`, >> public\cors-anywhere.js
    echo   changeOrigin: true, >> public\cors-anywhere.js
    echo   onProxyRes: (proxyRes) =^> { >> public\cors-anywhere.js
    echo     proxyRes.headers['Access-Control-Allow-Origin'] = '*'; >> public\cors-anywhere.js
    echo   } >> public\cors-anywhere.js
    echo })); >> public\cors-anywhere.js
    echo. >> public\cors-anywhere.js
    echo app.listen(CORS_PORT, () =^> { >> public\cors-anywhere.js
    echo   console.log(`CORS Proxy running on port ${CORS_PORT}`); >> public\cors-anywhere.js
    echo }); >> public\cors-anywhere.js
)

start "Second-Me CORS Proxy" cmd /k "title Second-Me CORS Proxy && color 5f && echo CORS proxy starting on port %CORS_PORT%... && echo. && node public/cors-anywhere.js"

:: 7. Start frontend
echo [7/7] Starting frontend service...
start "Second-Me Frontend" cmd /k "title Second-Me Frontend && color 2f && echo Frontend starting on port %FRONTEND_PORT%... && echo. && npm run dev"
cd ..

:: Open browser automatically
echo.
echo Starting browser...
timeout /t 5 /nobreak > nul
start http://localhost:%FRONTEND_PORT%

echo.
echo  ================================================
echo    All services started with CORS proxy!
echo  ================================================
echo.
echo  Backend: http://localhost:%BACKEND_PORT%
echo  CORS Proxy: http://localhost:%CORS_PORT%
echo  Frontend: http://localhost:%FRONTEND_PORT%
echo.
echo  プロファイル選択に問題がある場合:
echo  1. バックエンドウィンドウとCORSプロキシウィンドウが実行されていることを確認
echo  2. CORSプロキシウィンドウにエラーがないことを確認
echo  3. ブラウザで http://localhost:%CORS_PORT%/api/profiles を開いてみる
echo.
echo  To stop all services, close the command windows or run:
echo  taskkill /f /fi "WINDOWTITLE eq Second-Me*"
echo.
