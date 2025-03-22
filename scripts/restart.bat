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
echo %BOLD%Second-Me Windows Restart Script%NC%
echo %GRAY%%date% %time%%NC%
echo.

call :log_section "RESTARTING SERVICES"

:: First, stop all services
call :log_info "Stopping all services..."
call scripts\stop.bat

:: Wait a moment to ensure all services are properly shut down
timeout /t 3 /nobreak > nul

:: Then start the services again
call :log_info "Starting services again..."
call scripts\start.bat %*

call :log_section "RESTART COMPLETE"

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

:log_section
echo.
echo %CYAN%════════════════════════════════════════════════════════════════════════════════%NC%
echo %CYAN%  %~1%NC%
echo %CYAN%════════════════════════════════════════════════════════════════════════════════%NC%
echo.
exit /b
