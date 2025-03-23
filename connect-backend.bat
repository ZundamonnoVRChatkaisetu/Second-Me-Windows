@echo off
setlocal enabledelayedexpansion

title Second-Me Backend Connection

echo.
echo  ================================================
echo    Second-Me Windows - Backend Connection Tool
echo  ================================================
echo.

:: Default environment variables
set VENV_NAME=second-me-venv
set BACKEND_PORT=8002
set CORS_PORT=8003
set PYTHONIOENCODING=utf-8

:: Load environment variables from .env if exists
if exist .env (
    for /f "tokens=1,* delims==" %%a in (.env) do (
        if "%%a"=="VENV_NAME" set VENV_NAME=%%b
        if "%%a"=="LOCAL_APP_PORT" set BACKEND_PORT=%%b
    )
)

:: Export environment variables for the API
set LOCAL_APP_PORT=%BACKEND_PORT%
set CORS_PORT=%CORS_PORT%
set NODE_ENV=development

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

:: Start CORS proxy for backend connection
cd lpm_frontend

:: Make sure http-proxy-middleware is installed
if not exist node_modules\express (
    echo [INFO] Installing required dependencies...
    call npm install express http-proxy-middleware cors
)

:: Make sure directory exists
if not exist public mkdir public

:: Create CORS proxy entry point - ASCII only for reliability
if exist public\cors-anywhere.js del /f public\cors-anywhere.js

echo // CORS Proxy Server for Second-Me Windows > public\cors-anywhere.js
echo const express = require('express'); >> public\cors-anywhere.js
echo const httpProxy = require('http-proxy-middleware'); >> public\cors-anywhere.js
echo const createProxyMiddleware = httpProxy.createProxyMiddleware; >> public\cors-anywhere.js
echo. >> public\cors-anywhere.js
echo // Load environment variables >> public\cors-anywhere.js
echo const BACKEND_PORT = process.env.BACKEND_PORT || 8002; >> public\cors-anywhere.js
echo const CORS_PORT = process.env.CORS_PORT || 8003; >> public\cors-anywhere.js
echo. >> public\cors-anywhere.js
echo console.log('Environment Configuration:'); >> public\cors-anywhere.js
echo console.log(`  Backend Port: ${BACKEND_PORT}`); >> public\cors-anywhere.js
echo console.log(`  CORS Proxy Port: ${CORS_PORT}`); >> public\cors-anywhere.js
echo. >> public\cors-anywhere.js
echo const app = express(); >> public\cors-anywhere.js
echo. >> public\cors-anywhere.js
echo // Log request information >> public\cors-anywhere.js
echo app.use((req, res, next) =^> { >> public\cors-anywhere.js
echo   const timestamp = new Date().toISOString(); >> public\cors-anywhere.js
echo   console.log(`[${timestamp}] ${req.method} ${req.url}`); >> public\cors-anywhere.js
echo   next(); >> public\cors-anywhere.js
echo }); >> public\cors-anywhere.js
echo. >> public\cors-anywhere.js
echo // Add CORS headers >> public\cors-anywhere.js
echo app.use((req, res, next) =^> { >> public\cors-anywhere.js
echo   res.header('Access-Control-Allow-Origin', '*'); >> public\cors-anywhere.js
echo   res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS'); >> public\cors-anywhere.js
echo   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin'); >> public\cors-anywhere.js
echo   res.header('Access-Control-Max-Age', '3600'); >> public\cors-anywhere.js
echo. >> public\cors-anywhere.js
echo   // Handle preflight requests >> public\cors-anywhere.js
echo   if (req.method === 'OPTIONS') { >> public\cors-anywhere.js
echo     return res.status(200).end(); >> public\cors-anywhere.js
echo   } >> public\cors-anywhere.js
echo. >> public\cors-anywhere.js
echo   next(); >> public\cors-anywhere.js
echo }); >> public\cors-anywhere.js
echo. >> public\cors-anywhere.js
echo // Proxy API requests to backend >> public\cors-anywhere.js
echo const apiProxy = createProxyMiddleware({ >> public\cors-anywhere.js
echo   target: `http://localhost:${BACKEND_PORT}`, >> public\cors-anywhere.js
echo   changeOrigin: true, >> public\cors-anywhere.js
echo   pathRewrite: { >> public\cors-anywhere.js
echo     '^/api': '/api', // No path rewriting >> public\cors-anywhere.js
echo   }, >> public\cors-anywhere.js
echo   onProxyReq: (proxyReq, req, res) =^> { >> public\cors-anywhere.js
echo     // Add request headers if needed >> public\cors-anywhere.js
echo     proxyReq.setHeader('X-Forwarded-By', 'CORS-Proxy'); >> public\cors-anywhere.js
echo     console.log(`Proxy request: ${req.method} ${req.url}`); >> public\cors-anywhere.js
echo   }, >> public\cors-anywhere.js
echo   onProxyRes: (proxyRes, req, res) =^> { >> public\cors-anywhere.js
echo     // Add CORS related headers >> public\cors-anywhere.js
echo     proxyRes.headers['Access-Control-Allow-Origin'] = '*'; >> public\cors-anywhere.js
echo     proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, PUT, POST, DELETE, OPTIONS'; >> public\cors-anywhere.js
echo     proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin'; >> public\cors-anywhere.js
echo     console.log(`Response from backend: ${proxyRes.statusCode} ${req.method} ${req.url}`); >> public\cors-anywhere.js
echo   }, >> public\cors-anywhere.js
echo   onError: (err, req, res) =^> { >> public\cors-anywhere.js
echo     console.error('Proxy error:', err); >> public\cors-anywhere.js
echo     res.status(500).json({ >> public\cors-anywhere.js
echo       error: 'Could not connect to backend service. Please check if the service is running.', >> public\cors-anywhere.js
echo       code: 'ECONNREFUSED' >> public\cors-anywhere.js
echo     }); >> public\cors-anywhere.js
echo   } >> public\cors-anywhere.js
echo }); >> public\cors-anywhere.js
echo. >> public\cors-anywhere.js
echo // Health check endpoint >> public\cors-anywhere.js
echo app.get('/health', (req, res) =^> { >> public\cors-anywhere.js
echo   res.status(200).json({ >> public\cors-anywhere.js
echo     status: 'ok', >> public\cors-anywhere.js
echo     service: 'cors-proxy', >> public\cors-anywhere.js
echo     timestamp: new Date().toISOString() >> public\cors-anywhere.js
echo   }); >> public\cors-anywhere.js
echo }); >> public\cors-anywhere.js
echo. >> public\cors-anywhere.js
echo // Set up proxy middleware >> public\cors-anywhere.js
echo app.use('/api', apiProxy); >> public\cors-anywhere.js
echo app.use('/', apiProxy); // Also proxy requests to root path >> public\cors-anywhere.js
echo. >> public\cors-anywhere.js
echo // Start server >> public\cors-anywhere.js
echo app.listen(CORS_PORT, () =^> { >> public\cors-anywhere.js
echo   console.log(`CORS Proxy running on port ${CORS_PORT}...`); >> public\cors-anywhere.js
echo   console.log(`Connected to backend: http://localhost:${BACKEND_PORT}`); >> public\cors-anywhere.js
echo   console.log('Allowing CORS requests from all origins'); >> public\cors-anywhere.js
echo }); >> public\cors-anywhere.js
echo. >> public\cors-anywhere.js
echo // Handle graceful shutdown >> public\cors-anywhere.js
echo process.on('SIGINT', () =^> { >> public\cors-anywhere.js
echo   console.log('Shutting down CORS proxy...'); >> public\cors-anywhere.js
echo   process.exit(0); >> public\cors-anywhere.js
echo }); >> public\cors-anywhere.js

:: Create .env files for frontend to point to the CORS proxy
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%CORS_PORT% > lpm_frontend\.env
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%CORS_PORT% > lpm_frontend\.env.local
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%CORS_PORT% > lpm_frontend\.env.development
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%CORS_PORT% > lpm_frontend\.env.development.local

cd ..

:: Confirm venv is activated
echo [INFO] Python environment: %VIRTUAL_ENV%

:: Start backend and CORS proxy
echo [INFO] Starting backend services...
echo.
echo  ================================================
echo    Starting Backend and CORS Proxy
echo  ================================================
echo.

start "Second-Me Backend" cmd /k "title Second-Me Backend && color 1f && echo Backend starting on port %BACKEND_PORT%... && echo. && %VENV_NAME%\Scripts\activate.bat && python app.py"

:: Wait for backend to initialize
timeout /t 5 /nobreak > nul

:: Start CORS proxy
cd lpm_frontend
start "Second-Me CORS Proxy" cmd /k "title Second-Me CORS Proxy && color 5f && echo CORS proxy starting on port %CORS_PORT%... && echo. && node public/cors-anywhere.js"
cd ..

echo.
echo  ================================================
echo    Backend connection established!
echo  ================================================
echo.
echo  Backend: http://localhost:%BACKEND_PORT%
echo  CORS Proxy: http://localhost:%CORS_PORT%
echo.
echo  To test the connection, open:
echo  http://localhost:%CORS_PORT%/api/profiles
echo.
echo  If you see a JSON response, the connection is working.
echo.
echo  To stop these services, close the command windows or run:
echo  taskkill /f /fi "WINDOWTITLE eq Second-Me*"
echo.