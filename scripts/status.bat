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

:: Load environment variables from .env if exists
if exist .env (
    for /f "tokens=1,* delims==" %%a in (.env) do (
        set %%a=%%b
    )
)

:: Default environment variables
if not defined CONDA_DEFAULT_ENV set CONDA_DEFAULT_ENV=second-me
if not defined LOCAL_APP_PORT set LOCAL_APP_PORT=8002
if not defined LOCAL_FRONTEND_PORT set LOCAL_FRONTEND_PORT=3000

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
echo %BOLD%Second-Me Windows Status Script%NC%
echo %GRAY%%date% %time%%NC%
echo.

call :log_section "SERVICE STATUS"

:: Check backend status
echo %BOLD%Backend Service:%NC%
if exist run\.backend.pid (
    set /p PID=<run\.backend.pid
    
    :: Check if process exists
    tasklist /fi "pid eq %PID%" >nul 2>&1
    if %errorlevel% equ 0 (
        echo   %GREEN%● Running%NC% (PID: %PID%)
        
        :: Check if port is open
        call :check_port %LOCAL_APP_PORT%
        if %errorlevel% equ 0 (
            echo   %YELLOW%● Port %LOCAL_APP_PORT% is not responding%NC%
        ) else (
            echo   %GREEN%● Listening on port %LOCAL_APP_PORT%%NC%
            
            :: Check health endpoint
            curl -s -f "http://127.0.0.1:%LOCAL_APP_PORT%/health" >nul 2>&1
            if %errorlevel% equ 0 (
                echo   %GREEN%● Health check passed%NC%
            ) else (
                echo   %YELLOW%● Health check failed%NC%
            )
        )
    ) else (
        echo   %RED%● Not running%NC% (PID: %PID% - process not found)
    )
) else (
    echo   %RED%● Not running%NC% (no PID file found)
)

echo.

:: Check frontend status
echo %BOLD%Frontend Service:%NC%
if exist run\.frontend.pid (
    set /p PID=<run\.frontend.pid
    
    :: Check if process exists
    tasklist /fi "pid eq %PID%" >nul 2>&1
    if %errorlevel% equ 0 (
        echo   %GREEN%● Running%NC% (PID: %PID%)
        
        :: Check if port is open
        call :check_port %LOCAL_FRONTEND_PORT%
        if %errorlevel% equ 0 (
            echo   %YELLOW%● Port %LOCAL_FRONTEND_PORT% is not responding%NC%
        ) else (
            echo   %GREEN%● Listening on port %LOCAL_FRONTEND_PORT%%NC%
        )
    ) else (
        echo   %RED%● Not running%NC% (PID: %PID% - process not found)
    )
) else (
    echo   %RED%● Not running%NC% (no PID file found)
)

echo.

:: Check system resources
echo %BOLD%System Resources:%NC%

:: Check CPU usage
for /f "skip=1" %%p in ('wmic cpu get loadpercentage') do (
    set CPU_USAGE=%%p
    goto :cpu_done
)
:cpu_done

if not defined CPU_USAGE set CPU_USAGE=Unknown

:: Check memory usage
for /f "skip=1" %%p in ('wmic OS get FreePhysicalMemory^,TotalVisibleMemorySize /Format:Value') do (
    for /f "tokens=1,* delims==" %%a in ("%%p") do (
        if "%%a"=="FreePhysicalMemory" set FREE_MEM=%%b
        if "%%a"=="TotalVisibleMemorySize" set TOTAL_MEM=%%b
    )
)

if defined FREE_MEM if defined TOTAL_MEM (
    set /a "USED_MEM=TOTAL_MEM-FREE_MEM"
    set /a "MEM_PERCENTAGE=(USED_MEM*100)/TOTAL_MEM"
    set /a "FREE_MEM_GB=FREE_MEM/1024/1024"
    set /a "TOTAL_MEM_GB=TOTAL_MEM/1024/1024"
) else (
    set MEM_PERCENTAGE=Unknown
)

:: Display resource usage
if not "%CPU_USAGE%"=="Unknown" (
    if %CPU_USAGE% gtr 80 (
        echo   %RED%● CPU Usage: %CPU_USAGE%%%NC%
    ) else if %CPU_USAGE% gtr 50 (
        echo   %YELLOW%● CPU Usage: %CPU_USAGE%%%NC%
    ) else (
        echo   %GREEN%● CPU Usage: %CPU_USAGE%%%NC%
    )
) else (
    echo   %YELLOW%● CPU Usage: Unknown%NC%
)

if not "%MEM_PERCENTAGE%"=="Unknown" (
    if %MEM_PERCENTAGE% gtr 90 (
        echo   %RED%● Memory Usage: %MEM_PERCENTAGE%%% (%FREE_MEM_GB% GB free of %TOTAL_MEM_GB% GB)%NC%
    ) else if %MEM_PERCENTAGE% gtr 70 (
        echo   %YELLOW%● Memory Usage: %MEM_PERCENTAGE%%% (%FREE_MEM_GB% GB free of %TOTAL_MEM_GB% GB)%NC%
    ) else (
        echo   %GREEN%● Memory Usage: %MEM_PERCENTAGE%%% (%FREE_MEM_GB% GB free of %TOTAL_MEM_GB% GB)%NC%
    )
) else (
    echo   %YELLOW%● Memory Usage: Unknown%NC%
)

echo.

:: Show service URLs if running
if exist run\.frontend.pid if exist run\.backend.pid (
    call :log_section "SERVICE URLs"
    echo %BOLD%Frontend:%NC% http://localhost:%LOCAL_FRONTEND_PORT%
    echo %BOLD%Backend:%NC%  http://localhost:%LOCAL_APP_PORT%
    echo.
    echo %GREEN%You can access the application in your browser at:%NC%
    echo %BOLD%http://localhost:%LOCAL_FRONTEND_PORT%%NC%
)

exit /b 0

:: ==================== UTILITY FUNCTIONS ====================

:get_timestamp
set hour=%time:~0,2%
if "%hour:~0,1%" == " " set hour=0%hour:~1,1%
set timestamp=%date:~-4%-%date:~3,2%-%date:~0,2% %hour%:%time:~3,2%:%time:~6,2%
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
