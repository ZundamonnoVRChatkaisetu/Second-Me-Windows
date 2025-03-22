@echo off
setlocal enabledelayedexpansion

:: Script version
set VERSION=1.0.2

:: Default environment variables
set VENV_NAME=second-me-venv
set LOCAL_APP_PORT=8002
set LOCAL_FRONTEND_PORT=3000

:: Load environment variables from .env if exists
if exist .env (
    for /f "tokens=1,* delims==" %%a in (.env) do (
        if "%%a"=="VENV_NAME" set VENV_NAME=%%b
        if "%%a"=="LOCAL_APP_PORT" set LOCAL_APP_PORT=%%b
        if "%%a"=="LOCAL_FRONTEND_PORT" set LOCAL_FRONTEND_PORT=%%b
    )
)

:: Display header
echo.
echo  ================================================
echo    Second-Me Windows Start Script v%VERSION%
echo  ================================================
echo  %date% %time%
echo.

:: Functions
call :log_section "STARTING SERVICES"

:: Parse command line arguments
set BACKEND_ONLY=false
set HEALTH_CHECK_TIMEOUT=120
set SKIP_HEALTH_CHECK=false

:parse_args
if "%~1"=="" goto :end_parse_args
if "%~1"=="--backend-only" set BACKEND_ONLY=true
if "%~1"=="--skip-health-check" set SKIP_HEALTH_CHECK=true
shift
goto :parse_args
:end_parse_args

:: Check setup
call :check_setup_complete
if %errorlevel% neq 0 exit /b 1

:: Create directories if not exist
mkdir logs 2>nul
mkdir run 2>nul

:: Check port availability
call :log_info "Checking port availability..."
call :check_port %LOCAL_APP_PORT%
if %errorlevel% neq 0 (
    call :log_error "Backend port %LOCAL_APP_PORT% is already in use!"
    exit /b 1
)

if "%BACKEND_ONLY%"=="false" (
    call :check_port %LOCAL_FRONTEND_PORT%
    if %errorlevel% neq 0 (
        call :log_error "Frontend port %LOCAL_FRONTEND_PORT% is already in use!"
        exit /b 1
    )
)
call :log_success "All ports are available"

:: Start backend service
call :log_info "Starting backend service with venv: %VENV_NAME%"

:: Start in a new window to avoid blocking current console
start "Second-Me Backend" cmd /c "%VENV_NAME%\Scripts\activate.bat && python app.py > logs\backend.log 2>&1"
if %errorlevel% neq 0 (
    call :log_error "Failed to start backend service."
    exit /b 1
)

:: Save PID for stop script
for /f "tokens=2" %%a in ('tasklist /fi "windowtitle eq Second-Me Backend" /fo list ^| find "PID:"') do (
    echo %%a> run\.backend.pid
)
call :log_info "Backend service started in background"

:: Wait for backend to be healthy
if "%SKIP_HEALTH_CHECK%"=="false" (
    call :log_info "Waiting for backend service to be ready (timeout: %HEALTH_CHECK_TIMEOUT%s)..."
    call :check_backend_health %HEALTH_CHECK_TIMEOUT%
    if %errorlevel% neq 0 (
        call :log_warning "Backend health check timed out after %HEALTH_CHECK_TIMEOUT% seconds."
        call :log_warning "The service might still be starting up. You can try accessing it manually."
        call :log_warning "Backend URL: http://localhost:%LOCAL_APP_PORT%/health"
        
        choice /C YN /M "Do you want to continue anyway?"
        if !errorlevel! equ 2 (
            call :log_error "Stopping services as requested."
            call scripts\stop.bat
            exit /b 1
        )
    ) else (
        call :log_success "Backend service is ready"
    )
) else (
    call :log_info "Skipping backend health check as requested."
    call :log_info "Waiting 5 seconds for the backend to start..."
    timeout /t 5 /nobreak > nul
)

:: Start frontend service if not backend-only mode
if "%BACKEND_ONLY%"=="false" (
    if not exist lpm_frontend (
        call :log_error "Frontend directory 'lpm_frontend' not found!"
        exit /b 1
    )
    
    call :log_info "Starting frontend service..."
    cd lpm_frontend
    
    :: Check if node_modules exists
    if not exist node_modules (
        call :log_info "Frontend dependencies not found. Installing now..."
        npm install
        if %errorlevel% neq 0 (
            call :log_error "Failed to install frontend dependencies"
            cd ..
            exit /b 1
        )
        call :log_success "Frontend dependencies installed"
    )
    
    :: Start frontend in background
    call :log_info "Starting frontend dev server..."
    start "Second-Me Frontend" cmd /c "npm run dev > ..\logs\frontend.log 2>&1"
    if %errorlevel% neq 0 (
        call :log_error "Failed to start frontend service."
        cd ..
        exit /b 1
    )
    
    :: Save PID for stop script
    for /f "tokens=2" %%a in ('tasklist /fi "windowtitle eq Second-Me Frontend" /fo list ^| find "PID:"') do (
        echo %%a> ..\run\.frontend.pid
    )
    call :log_info "Frontend service started in background"
    
    :: Wait for frontend to be ready
    call :log_info "Waiting for frontend service to be ready..."
    call :check_frontend_ready 120
    if %errorlevel% neq 0 (
        call :log_warning "Frontend service may not be fully ready yet."
        call :log_warning "Check logs\frontend.log for any issues."
        
        choice /C YN /M "Do you want to continue anyway?"
        if !errorlevel! equ 2 (
            call :log_error "Stopping services as requested."
            call scripts\stop.bat
            cd ..
            exit /b 1
        )
    ) else (
        call :log_success "Frontend service is ready"
    )
    cd ..
)

:: Display service URLs
call :log_section "Services are running"
if "%BACKEND_ONLY%"=="true" (
    call :log_info "Backend URL:  http://localhost:%LOCAL_APP_PORT%"
) else (
    call :log_info "Frontend URL: http://localhost:%LOCAL_FRONTEND_PORT%"
    call :log_info "Backend URL:  http://localhost:%LOCAL_APP_PORT%"
    
    :: Open browser automatically
    start http://localhost:%LOCAL_FRONTEND_PORT%
)

exit /b 0

:: ==================== UTILITY FUNCTIONS ====================

:log_info
echo [INFO]    %~1
exit /b

:log_success
echo [SUCCESS] %~1
exit /b

:log_warning
echo [WARNING] %~1
exit /b

:log_error
echo [ERROR]   %~1
exit /b

:log_section
echo.
echo  ================================================
echo    %~1
echo  ================================================
echo.
exit /b

:check_port
set PORT=%~1
netstat -ano | findstr ":%PORT% " | findstr "LISTENING" > nul
if %errorlevel% equ 0 exit /b 1
exit /b 0

:check_backend_health
set MAX_ATTEMPTS=%~1
set ATTEMPT=1
set BACKEND_URL=http://127.0.0.1:%LOCAL_APP_PORT%/health

:check_backend_loop
if %ATTEMPT% gtr %MAX_ATTEMPTS% exit /b 1
curl -s -f "%BACKEND_URL%" > nul 2>&1
if %errorlevel% equ 0 exit /b 0
timeout /t 1 /nobreak > nul
set /a ATTEMPT+=1
goto :check_backend_loop

:check_frontend_ready
set MAX_ATTEMPTS=%~1
set ATTEMPT=1
set FRONTEND_LOG=..\logs\frontend.log

:check_frontend_loop
if %ATTEMPT% gtr %MAX_ATTEMPTS% exit /b 1
findstr /c:"Local:" "%FRONTEND_LOG%" > nul 2>&1
if %errorlevel% equ 0 exit /b 0
timeout /t 1 /nobreak > nul
set /a ATTEMPT+=1
goto :check_frontend_loop

:check_setup_complete
call :log_info "Checking if setup is complete..."

:: Check if venv exists
if not exist %VENV_NAME% (
    call :log_error "Python virtual environment '%VENV_NAME%' not found. Please run 'scripts\setup.bat' first."
    exit /b 1
)

:: Check if llama.cpp exists and has been built
if not exist llama.cpp (
    call :log_error "llama.cpp directory not found. Please run 'scripts\setup.bat' first."
    exit /b 1
)

if not exist llama.cpp\build\bin\Release\llama-server.exe (
    call :log_error "llama-server executable not found. Please run 'scripts\setup.bat' first."
    exit /b 1
)

:: Modified check - No longer exiting with error if node_modules is missing
:: Instead, we'll install them later if they're missing
if not exist lpm_frontend\node_modules if "%BACKEND_ONLY%"=="false" (
    call :log_warning "Frontend dependencies not installed, will attempt to install during startup."
)

call :log_success "Setup check passed"
exit /b 0
