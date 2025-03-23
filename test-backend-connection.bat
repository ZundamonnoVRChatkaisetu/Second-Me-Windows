@echo off
setlocal enabledelayedexpansion

title Second-Me Windows - Backend Connection Test

REM コードページをUTF-8に設定
chcp 65001 > nul

REM カラー設定（Windows 10以降で有効）
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "RESET=[0m"
set "BOLD=[1m"
set "BLUE=[94m"

echo %BOLD%%BLUE%====================================================%RESET%
echo %BOLD%%BLUE%  Second-Me Windows - Backend Connection Test      %RESET%
echo %BOLD%%BLUE%====================================================%RESET%
echo.

REM バックエンドのポート設定
set "BACKEND_PORT=8002"

REM 環境変数をenvファイルから読み込み
if exist ".env" (
    echo %GREEN%[INFO]%RESET% Loading environment variables from .env file...
    for /f "tokens=1,* delims==" %%a in (.env) do (
        if "%%a"=="LOCAL_APP_PORT" set BACKEND_PORT=%%b
    )
)

echo %GREEN%[INFO]%RESET% Using backend port: %BACKEND_PORT%

REM バックエンドサーバーの死活確認
echo %GREEN%[INFO]%RESET% Checking if backend server is running...

netstat -ano | findstr ":%BACKEND_PORT% " | findstr "LISTENING" > nul
if %errorlevel% equ 0 (
    echo %GREEN%[INFO]%RESET% Found a process listening on port %BACKEND_PORT%.
) else (
    echo %RED%[ERROR]%RESET% No process is listening on port %BACKEND_PORT%!
    echo %YELLOW%[SOLUTION]%RESET% 1. Run 'start-backend-only.bat' to start the backend server.
    echo %YELLOW%[SOLUTION]%RESET% 2. Check if the backend server is running with the correct port.
    echo.
    goto :exit_error
)

REM curlが利用可能か確認
curl --version > nul 2>&1
if %errorlevel% neq 0 (
    echo %YELLOW%[WARN]%RESET% curl not found, trying with PowerShell...
    
    echo %GREEN%[INFO]%RESET% Testing backend health endpoint...
    powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:%BACKEND_PORT%/health' -UseBasicParsing; Write-Host \"Status code: \" $response.StatusCode; if ($response.StatusCode -eq 200) { Write-Host \"✅ Backend server is running and healthy.\" } else { Write-Host \"❌ Backend server returned unexpected status code.\" } } catch { Write-Host \"❌ Failed to connect to backend: $($_.Exception.Message)\" }"
    
    echo.
    echo %GREEN%[INFO]%RESET% Testing CORS (OPTIONS request)...
    powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:%BACKEND_PORT%/health' -Method 'OPTIONS' -UseBasicParsing; Write-Host \"Status code: \" $response.StatusCode; $corsHeader = $response.Headers.'Access-Control-Allow-Origin'; if ($corsHeader -eq '*') { Write-Host \"✅ CORS headers are properly configured.\" } else { Write-Host \"❌ CORS headers may not be properly configured.\" } } catch { Write-Host \"❌ Failed to test CORS: $($_.Exception.Message)\" }"
) else (
    echo %GREEN%[INFO]%RESET% Testing backend health endpoint...
    curl -s -o test_output.tmp -w "Status code: %%{http_code}\n" http://localhost:%BACKEND_PORT%/health
    set /p RESPONSE=<test_output.tmp
    del test_output.tmp
    
    echo Response: %RESPONSE%
    
    echo.
    echo %GREEN%[INFO]%RESET% Testing CORS (OPTIONS request)...
    curl -s -X OPTIONS -I http://localhost:%BACKEND_PORT%/health | findstr "Access-Control-Allow-Origin" > cors_output.tmp
    set /p CORS_HEADER=<cors_output.tmp
    del cors_output.tmp
    
    echo CORS Headers: %CORS_HEADER%
    
    if "%CORS_HEADER%" == "" (
        echo %RED%[ERROR]%RESET% CORS headers not found in response!
        echo %YELLOW%[SOLUTION]%RESET% Check if CORS is properly configured in your backend.
    ) else (
        echo %GREEN%[INFO]%RESET% CORS headers found in response.
    )
)

echo.
echo %GREEN%[INFO]%RESET% Testing profiles endpoint...
curl -s -o test_profiles.tmp -w "Status code: %%{http_code}\n" http://localhost:%BACKEND_PORT%/api/profiles

if %errorlevel% equ 0 (
    echo %GREEN%[INFO]%RESET% Profiles endpoint returned a response.
) else (
    echo %RED%[ERROR]%RESET% Failed to connect to profiles endpoint!
    echo %YELLOW%[SOLUTION]%RESET% Check if the backend server is running and the endpoint exists.
)

if exist test_profiles.tmp (
    echo %GREEN%[INFO]%RESET% Checking profiles response content...
    type test_profiles.tmp
    del test_profiles.tmp
)

goto :exit_success

:exit_error
echo.
echo %RED%[ERROR]%RESET% Backend connection test failed!
exit /b 1

:exit_success
echo.
echo %GREEN%[SUCCESS]%RESET% Backend connection test completed.
echo.
echo %BOLD%Tips for resolving connection issues:%RESET%
echo 1. Make sure backend server is running (start-backend-only.bat)
echo 2. Check for CORS configuration issues in app.py
echo 3. Verify that required ports (8002 by default) aren't blocked by firewall
echo 4. Look for errors in the logs/ directory
echo.
echo Press any key to exit...
pause > nul
exit /b 0
