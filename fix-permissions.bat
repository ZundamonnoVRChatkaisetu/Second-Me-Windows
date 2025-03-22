@echo off
setlocal

echo.
echo  ================================================
echo    Second-Me Windows System Repair Tool
echo  ================================================
echo.
echo This script repairs directories and file permissions,
echo checks for port conflicts, and cleans up processes.
echo.
echo 1. Check log directories
echo 2. Clean up backend processes
echo 3. Check for port conflicts
echo.

:: Admin check
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] This script is running without administrator privileges.
    echo           Some operations may be limited.
    echo.
    pause
)

:: Fix log directory permissions
echo [RUNNING] Checking logs directory...
if not exist logs (
    mkdir logs
    echo [INFO] Created logs directory.
) else (
    echo [INFO] Logs directory already exists.
)

:: Fix run directory permissions
echo [RUNNING] Checking run directory...
if not exist run (
    mkdir run
    echo [INFO] Created run directory.
) else (
    echo [INFO] Run directory already exists.
)

:: Clean up backend processes
echo [RUNNING] Cleaning up backend processes...
taskkill /f /fi "WINDOWTITLE eq Second-Me Backend" >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Terminated backend processes.
) else (
    echo [INFO] No running backend processes found.
)

:: Clean up frontend processes
echo [RUNNING] Cleaning up frontend processes...
taskkill /f /fi "WINDOWTITLE eq Second-Me Frontend" >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Terminated frontend processes.
) else (
    echo [INFO] No running frontend processes found.
)

:: Delete PID files
echo [RUNNING] Deleting PID files...
if exist run\.backend.pid del /f run\.backend.pid
if exist run\.frontend.pid del /f run\.frontend.pid

:: Check port conflicts
echo [RUNNING] Checking for port conflicts...

:: Check backend port
echo [RUNNING] Checking backend port (8002)...
netstat -ano | findstr ":8002" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [WARNING] Port 8002 is already in use.
    echo           Do you want to free this port? (Y/N)
    choice /c YN
    if !errorlevel! equ 1 (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8002" ^| findstr "LISTENING"') do (
            echo [RUNNING] Terminating process with PID %%a...
            taskkill /f /pid %%a >nul 2>&1
            if !errorlevel! equ 0 (
                echo [INFO] Port 8002 has been freed.
            ) else (
                echo [ERROR] Failed to terminate process. Try running as administrator.
            )
        )
    )
) else (
    echo [INFO] Port 8002 is available.
)

:: Check frontend port
echo [RUNNING] Checking frontend port (3000)...
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [WARNING] Port 3000 is already in use.
    echo           Do you want to free this port? (Y/N)
    choice /c YN
    if !errorlevel! equ 1 (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
            echo [RUNNING] Terminating process with PID %%a...
            taskkill /f /pid %%a >nul 2>&1
            if !errorlevel! equ 0 (
                echo [INFO] Port 3000 has been freed.
            ) else (
                echo [ERROR] Failed to terminate process. Try running as administrator.
            )
        )
    )
) else (
    echo [INFO] Port 3000 is available.
)

echo.
echo [RUNNING] Setup is complete.
echo          You can now run the application in foreground mode:
echo.
echo          Backend: foreground-backend.bat
echo          Frontend: foreground-frontend.bat
echo.
echo          Or start in normal mode:
echo          scripts\start.bat --skip-health-check
echo.

pause
