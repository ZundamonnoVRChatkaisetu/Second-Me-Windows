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
    echo       Please start the backend server using start-all-in-one.bat or start-new-ui.bat
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
    echo       Please start the frontend server using start-all-in-one.bat or start-new-ui.bat
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
    echo [WARNING] lpm_frontend\.env does not exist (may not be required)
)

if exist lpm_frontend\.env.local (
    echo [OK] lpm_frontend\.env.local exists
    echo Content:
    type lpm_frontend\.env.local
    echo.
    
    findstr "NEXT_PUBLIC_BACKEND_URL" lpm_frontend\.env.local >nul
    if %errorlevel% equ 0 (
        echo [OK] NEXT_PUBLIC_BACKEND_URL is properly configured in .env.local
        for /f "tokens=1,* delims==" %%a in ('findstr "NEXT_PUBLIC_BACKEND_URL" lpm_frontend\.env.local') do (
            set BACKEND_URL=%%b
            echo       Configured URL: %%b
        )
    ) else (
        echo [ERROR] NEXT_PUBLIC_BACKEND_URL is missing from .env.local
        echo       Adding default backend URL configuration...
        echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%BACKEND_PORT% > lpm_frontend\.env.local
        echo       Created new .env.local with NEXT_PUBLIC_BACKEND_URL=http://localhost:%BACKEND_PORT%
        set BACKEND_URL=http://localhost:%BACKEND_PORT%
    )
) else (
    echo [ERROR] lpm_frontend\.env.local does not exist
    echo       Creating .env.local with default backend URL...
    echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%BACKEND_PORT% > lpm_frontend\.env.local
    echo       Created new .env.local with NEXT_PUBLIC_BACKEND_URL=http://localhost:%BACKEND_PORT%
    set BACKEND_URL=http://localhost:%BACKEND_PORT%
)

echo.

:: Check backend CORS settings
echo Checking backend CORS settings...
echo.

:: Test backend connectivity
echo Testing backend connectivity...
curl -s -o backend_response.tmp -w "Status Code: %%{http_code}\n" http://localhost:%BACKEND_PORT%/health

if %errorlevel% equ 0 (
    echo [OK] Backend is responding at http://localhost:%BACKEND_PORT%/health
    
    :: Check CORS headers with OPTIONS request
    echo Testing CORS headers (OPTIONS request)...
    curl -s -X OPTIONS -H "Origin: http://localhost:%FRONTEND_PORT%" -H "Access-Control-Request-Method: GET" -o cors_response.tmp -D cors_headers.tmp http://localhost:%BACKEND_PORT%/api/profiles
    
    findstr /C:"Access-Control-Allow-Origin" cors_headers.tmp >nul
    if %errorlevel% equ 0 (
        echo [OK] Backend has CORS headers configured
        echo Headers from OPTIONS request:
        for /f "delims=" %%a in ('findstr /C:"Access-Control-" cors_headers.tmp') do (
            echo       %%a
        )
    ) else (
        echo [ERROR] Backend is missing CORS headers
        echo       Please use start-with-cors.bat instead of regular start scripts
    )
    
    :: Check for profiles API
    echo Testing profiles API...
    curl -s -o profiles_response.tmp -w "Status Code: %%{http_code}\n" http://localhost:%BACKEND_PORT%/api/profiles
    
    if exist profiles_response.tmp (
        findstr /C:"profiles" profiles_response.tmp >nul
        if %errorlevel% equ 0 (
            echo [OK] Profiles API is responding correctly
        ) else (
            echo [ERROR] Profiles API is not returning expected data
            echo       Response content:
            type profiles_response.tmp
        )
    )
) else (
    echo [ERROR] Could not connect to backend at http://localhost:%BACKEND_PORT%/health
    echo       Make sure the backend is running
)

echo.
echo Testing profile activation API...
echo.

:: Test profile activation
curl -s -X OPTIONS -H "Origin: http://localhost:%FRONTEND_PORT%" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type" -o activate_options.tmp -D activate_headers.tmp http://localhost:%BACKEND_PORT%/api/profiles/activate

findstr /C:"Access-Control-Allow-Origin" activate_headers.tmp >nul
if %errorlevel% equ 0 (
    echo [OK] Profile activation endpoint has CORS headers configured
    echo Headers from OPTIONS request:
    for /f "delims=" %%a in ('findstr /C:"Access-Control-" activate_headers.tmp') do (
        echo       %%a
    )
) else (
    echo [ERROR] Profile activation endpoint is missing CORS headers
    echo       This could cause profile selection to fail
)

echo.
echo Comprehensive Connection Report:
echo ---------------------------------
netstat -ano | findstr ":%BACKEND_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (set backend_status=Running) else (set backend_status=Not Running)

netstat -ano | findstr ":%FRONTEND_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (set frontend_status=Running) else (set frontend_status=Not Running)

if exist lpm_frontend\.env.local (set env_file_status=Exists) else (set env_file_status=Missing)

curl -s -o nul -w "%%{http_code}" http://localhost:%BACKEND_PORT%/health > http_code.tmp
set /p health_status=<http_code.tmp
if "%health_status%"=="200" (set health_api_status=Responding) else (set health_api_status=Not Responding)

echo Backend: %backend_status% (Port %BACKEND_PORT%)
echo Frontend: %frontend_status% (Port %FRONTEND_PORT%)
echo .env.local: %env_file_status%
echo Health API: %health_api_status%
echo.

echo Recommended Actions:
echo ---------------------------------
if "%backend_status%"=="Not Running" (
    echo [!] Start the backend using start-all-in-one.bat or start-new-ui.bat
)
if "%frontend_status%"=="Not Running" (
    echo [!] Start the frontend using start-all-in-one.bat or start-new-ui.bat
)
if "%env_file_status%"=="Missing" (
    echo [!] Create lpm_frontend\.env.local with NEXT_PUBLIC_BACKEND_URL=http://localhost:%BACKEND_PORT%
)
if not "%health_api_status%"=="Responding" (
    echo [!] Backend is not responding. Check if it's running correctly.
)
if "%backend_status%"=="Running" if "%frontend_status%"=="Running" if "%env_file_status%"=="Exists" if "%health_api_status%"=="Responding" (
    echo [✓] All systems appear to be running correctly!
    echo [i] If you're still experiencing issues, try using start-with-cors.bat
)

:: Cleanup temporary files
if exist backend_response.tmp del backend_response.tmp
if exist cors_response.tmp del cors_response.tmp
if exist cors_headers.tmp del cors_headers.tmp
if exist profiles_response.tmp del profiles_response.tmp
if exist activate_options.tmp del activate_options.tmp
if exist activate_headers.tmp del activate_headers.tmp
if exist http_code.tmp del http_code.tmp

echo.
echo  ================================================
echo    Debug complete! Check the results above.
echo  ================================================
echo.

pause
