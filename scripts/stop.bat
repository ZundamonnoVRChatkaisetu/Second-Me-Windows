@echo off
setlocal enabledelayedexpansion

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
echo %BOLD%Second-Me Windows Stop Script%NC%
echo %GRAY%%date% %time%%NC%
echo.

call :log_section "STOPPING SERVICES"

:: Create run directory if it doesn't exist
mkdir run 2>nul

:: Stop backend
if exist run\.backend.pid (
    call :log_info "Stopping backend service..."
    set /p PID=<run\.backend.pid
    
    :: Check if process exists
    tasklist /fi "pid eq %PID%" >nul 2>&1
    if %errorlevel% equ 0 (
        taskkill /PID %PID% /F >nul 2>&1
        if %errorlevel% equ 0 (
            call :log_success "Backend service stopped (PID: %PID%)"
        ) else (
            call :log_error "Failed to stop backend service (PID: %PID%)"
        )
    ) else (
        call :log_warning "Backend service not found (PID: %PID%)"
    )
    
    :: Delete PID file
    del run\.backend.pid >nul 2>&1
) else (
    call :log_warning "Backend service not running (no PID file found)"
)

:: Stop frontend
if exist run\.frontend.pid (
    call :log_info "Stopping frontend service..."
    set /p PID=<run\.frontend.pid
    
    :: Check if process exists
    tasklist /fi "pid eq %PID%" >nul 2>&1
    if %errorlevel% equ 0 (
        taskkill /PID %PID% /F >nul 2>&1
        if %errorlevel% equ 0 (
            call :log_success "Frontend service stopped (PID: %PID%)"
        ) else (
            call :log_error "Failed to stop frontend service (PID: %PID%)"
        )
    ) else (
        call :log_warning "Frontend service not found (PID: %PID%)"
    )
    
    :: Delete PID file
    del run\.frontend.pid >nul 2>&1
) else (
    call :log_warning "Frontend service not running (no PID file found)"
)

:: Kill any remaining Node.js processes related to Second-Me (fallback)
call :log_info "Checking for remaining processes..."

:: Check for any node processes running on the frontend port
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%LOCAL_FRONTEND_PORT% "') do (
    set NODE_PID=%%a
    tasklist /fi "pid eq !NODE_PID!" | findstr "node.exe" >nul 2>&1
    if !errorlevel! equ 0 (
        call :log_warning "Found orphaned node process for frontend (PID: !NODE_PID!)"
        taskkill /PID !NODE_PID! /F >nul 2>&1
        if !errorlevel! equ 0 (
            call :log_success "Stopped orphaned node process (PID: !NODE_PID!)"
        )
    )
)

:: Check for any python processes related to Second-Me
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq python.exe" /fo list ^| find "PID:"') do (
    set PYTHON_PID=%%a
    wmic process where processid=!PYTHON_PID! get commandline 2>nul | findstr "app.py" >nul 2>&1
    if !errorlevel! equ 0 (
        call :log_warning "Found orphaned python process for backend (PID: !PYTHON_PID!)"
        taskkill /PID !PYTHON_PID! /F >nul 2>&1
        if !errorlevel! equ 0 (
            call :log_success "Stopped orphaned python process (PID: !PYTHON_PID!)"
        )
    )
)

call :log_section "ALL SERVICES STOPPED"
call :log_success "You can restart the application using: scripts\start.bat"

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
