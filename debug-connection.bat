@echo off
setlocal enabledelayedexpansion

echo.
echo  ================================================
echo    Second-Me Windows - Connection Debug Tool
echo  ================================================
echo.

:: Default environment variables
set BACKEND_PORT=8002
set FRONTEND_PORT=3000

:: Load environment variables from .env if exists
if exist .env (
    for /f "tokens=1,* delims==" %%a in (.env) do (
        if "%%a"=="LOCAL_APP_PORT" set BACKEND_PORT=%%b
        if "%%a"=="LOCAL_FRONTEND_PORT" set FRONTEND_PORT=%%b
    )
)

:: Display environment settings
echo.
echo Current Environment:
echo - Backend Port: %BACKEND_PORT%
echo - Frontend Port: %FRONTEND_PORT%
echo.

:: Check if backend port is in use
echo Checking port %BACKEND_PORT% (Backend)...
netstat -ano | findstr ":%BACKEND_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [OK] Port %BACKEND_PORT% is in use (Backend is running)
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%BACKEND_PORT% " ^| findstr "LISTENING"') do (
        echo       Process ID: %%a
        for /f "tokens=1,2,*" %%b in ('tasklist ^| findstr "%%a"') do (
            echo       Process Name: %%b
        )
    )
) else (
    echo [ERROR] Port %BACKEND_PORT% is not in use (Backend is not running)
)

echo.

:: Check if frontend port is in use
echo Checking port %FRONTEND_PORT% (Frontend)...
netstat -ano | findstr ":%FRONTEND_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [OK] Port %FRONTEND_PORT% is in use (Frontend is running)
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%FRONTEND_PORT% " ^| findstr "LISTENING"') do (
        echo       Process ID: %%a
        for /f "tokens=1,2,*" %%b in ('tasklist ^| findstr "%%a"') do (
            echo       Process Name: %%b
        )
    )
) else (
    echo [ERROR] Port %FRONTEND_PORT% is not in use (Frontend is not running)
)

echo.

:: Check .env files in frontend
echo Checking frontend .env files...
echo.

if exist lpm_frontend\.env (
    echo [OK] lpm_frontend\.env exists
    echo Content:
    type lpm_frontend\.env
    echo.
) else (
    echo [ERROR] lpm_frontend\.env does not exist
)

if exist lpm_frontend\.env.local (
    echo [OK] lpm_frontend\.env.local exists
    echo Content:
    type lpm_frontend\.env.local
    echo.
) else (
    echo [ERROR] lpm_frontend\.env.local does not exist
)

if exist lpm_frontend\.env.development (
    echo [OK] lpm_frontend\.env.development exists
    echo Content:
    type lpm_frontend\.env.development
    echo.
) else (
    echo [ERROR] lpm_frontend\.env.development does not exist
)

if exist lpm_frontend\.env.development.local (
    echo [OK] lpm_frontend\.env.development.local exists
    echo Content:
    type lpm_frontend\.env.development.local
    echo.
) else (
    echo [ERROR] lpm_frontend\.env.development.local does not exist
)

echo.

:: Test backend connectivity
echo Testing backend connectivity...
curl -s -o nul -w "Status Code: %%{http_code}\n" http://localhost:%BACKEND_PORT%/health
if %errorlevel% equ 0 (
    echo [OK] Backend is responding at http://localhost:%BACKEND_PORT%/health
) else (
    echo [ERROR] Could not connect to backend at http://localhost:%BACKEND_PORT%/health
)

echo.
echo  ================================================
echo    Debug complete! Check the results above.
echo  ================================================
echo.

pause
