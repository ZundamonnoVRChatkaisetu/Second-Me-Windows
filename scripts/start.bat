@echo off
setlocal enabledelayedexpansion

:: Script version
set VERSION=1.0.0

:: Color definitions (Windows)
set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set BLUE=[94m
set MAGENTA=[95m
set CYAN=[96m
set GRAY=[90m
set BOLD=[1m
set NC=[0m

:: Default environment variables
if not defined CONDA_DEFAULT_ENV set CONDA_DEFAULT_ENV=second-me
if not defined LOCAL_APP_PORT set LOCAL_APP_PORT=8002
if not defined LOCAL_FRONTEND_PORT set LOCAL_FRONTEND_PORT=3000

:: Load environment variables from .env if exists
if exist .env (
    for /f "tokens=1,* delims==" %%a in (.env) do (
        set %%a=%%b
    )
)

:: Display header
echo.
echo %CYAN%
echo  ███████╗███████╗ ██████╗ ██████╗ ███╗   ██╗██████╗       ███╗   ███╗███████╗
echo  ██╔════╝██╔════╝██╔════╝██╔═══██╗████╗  ██║██╔══██╗      ████╗ ████║██╔════╝
echo  ███████╗█████╗  ██║     ██║   ██║██╔██╗ ██║██║  ██║█████╗██╔████╔██║█████╗  
echo  ╚════██║██╔══╝  ██║     ██║   ██║██║╚██╗██║██║  ██║╚════╝██║╚██╔╝██║██╔══╝  
echo  ███████║███████╗╚██████╗╚██████╔╝██║ ╚████║██████╔╝      ██║ ╚═╝ ██║███████╗
echo  ╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚═════╝       ╚═╝     ╚═╝╚══════╝
echo %NC%
echo %BOLD%Second-Me Windows Start Script v%VERSION%%NC%
echo %GRAY%%date% %time%%NC%
echo.

:: Functions
call :log_section "STARTING SERVICES"

:: Parse command line arguments
set BACKEND_ONLY=false
:parse_args
if "%~1"=="" goto :end_parse_args
if "%~1"=="--backend-only" set BACKEND_ONLY=true
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
call :log_info "Starting backend service with conda environment: %CONDA_DEFAULT_ENV%"

:: Start in a new window to avoid blocking current console
start "Second-Me Backend" cmd /c "conda activate %CONDA_DEFAULT_ENV% && python app.py > logs\backend.log 2>&1"
if %errorlevel% neq 0 (
    call :log_error "Failed to start backend service."
    exit /b 1
)

:: Save PID for stop script
for /f "tokens=2" %%a in ('tasklist /fi "windowtitle eq Second-Me Backend" /fo list ^| find "PID:"') do (
    echo %%a> run\.backend.pid
)
call :log_info "Backend service started in background with PID: %PID%"

:: Wait for backend to be healthy
call :log_info "Waiting for backend service to be ready..."
call :check_backend_health 60
if %errorlevel% neq 0 (
    call :log_error "Backend service failed to start within 60 seconds"
    exit /b 1
)
call :log_success "Backend service is ready"

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
        call :log_info "Installing frontend dependencies..."
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
    call :check_frontend_ready 60
    if %errorlevel% neq 0 (
        call :log_error "Frontend service failed to start within 60 seconds"
        cd ..
        exit /b 1
    )
    call :log_success "Frontend service is ready"
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

:get_timestamp
set hour=%time:~0,2%
if "%hour:~0,1%" == " " set hour=0%hour:~1,1%
set timestamp=%date:~-4%-%date:~3,2%-%date:~0,2% %hour%:%time:~3,2%:%time:~6,2%
exit /b

:log_info
call :get_timestamp
echo %GRAY%[%timestamp%]%NC% %GREEN%[INFO]%NC%    %~1
exit /b

:log_success
call :get_timestamp
echo %GRAY%[%timestamp%]%NC% %GREEN%[SUCCESS]%NC% %~1
exit /b

:log_warning
call :get_timestamp
echo %GRAY%[%timestamp%]%NC% %YELLOW%[WARNING]%NC% %~1
exit /b

:log_error
call :get_timestamp
echo %GRAY%[%timestamp%]%NC% %RED%[ERROR]%NC%   %~1
exit /b

:log_section
echo.
echo %CYAN%════════════════════════════════════════════════════════════════════════════════%NC%
echo %CYAN%  %~1%NC%
echo %CYAN%════════════════════════════════════════════════════════════════════════════════%NC%
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

:: Check if conda environment exists
conda env list | findstr /C:"%CONDA_DEFAULT_ENV%" > nul
if %errorlevel% neq 0 (
    call :log_error "Conda environment '%CONDA_DEFAULT_ENV%' not found. Please run 'scripts\setup.bat' first."
    exit /b 1
)

:: Check if frontend dependencies are installed
if not exist lpm_frontend\node_modules if "%BACKEND_ONLY%" neq "true" (
    call :log_error "Frontend dependencies not installed. Please run 'scripts\setup.bat' first."
    exit /b 1
)

call :log_success "Setup check passed"
exit /b 0
