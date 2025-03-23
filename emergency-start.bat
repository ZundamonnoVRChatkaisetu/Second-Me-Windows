@echo off
title Second-Me Windows - Emergency Start Tool

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
echo %BOLD%%BLUE%      Second-Me Windows Emergency Start Tool       %RESET%
echo %BOLD%%BLUE%====================================================%RESET%
echo.

REM ログディレクトリ作成
if not exist "logs" mkdir logs

REM 1. 実行中のプロセスを強制終了
echo %YELLOW%[WARN]%RESET% 1. Terminating all existing Second-Me processes...
taskkill /f /fi "WINDOWTITLE eq Second-Me*" > nul 2>&1

REM 2. 必要なポートの解放
echo %GREEN%[INFO]%RESET% 2. Checking and releasing required ports...

REM ポート8002のチェックと解放
netstat -ano | findstr ":8002 " > nul
if %errorlevel% equ 0 (
    echo %YELLOW%[WARN]%RESET% Port 8002 is already in use. Attempting to release...
    for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8002 "') do (
        echo %GREEN%[INFO]%RESET% Terminating process with PID: %%p
        taskkill /F /PID %%p > nul 2>&1
    )
) else (
    echo %GREEN%[INFO]%RESET% Port 8002 is available.
)

REM ポート3000のチェックと解放
netstat -ano | findstr ":3000 " > nul
if %errorlevel% equ 0 (
    echo %YELLOW%[WARN]%RESET% Port 3000 is already in use. Attempting to release...
    for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000 "') do (
        echo %GREEN%[INFO]%RESET% Terminating process with PID: %%p
        taskkill /F /PID %%p > nul 2>&1
    )
) else (
    echo %GREEN%[INFO]%RESET% Port 3000 is available.
)

REM 3. 環境変数の設定
echo %GREEN%[INFO]%RESET% 3. Setting environment variables...

REM 環境変数設定 - スペースがないことを確認
set "LOCAL_APP_PORT=8002"
set "LOG_LEVEL=INFO"
set "PYTHONIOENCODING=utf-8"

REM 4. フロントエンド環境変数ファイルの作成
echo %GREEN%[INFO]%RESET% 4. Updating frontend environment variables...
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:8002 > lpm_frontend\.env.local

REM 5. バックエンドの起動（エラー検出モードで）
echo %GREEN%[INFO]%RESET% 5. Starting backend server in diagnostic mode...
start "Second-Me Backend" cmd /c "python app.py & pause"

REM バックエンドの起動を待機
echo %GREEN%[INFO]%RESET% Waiting for backend to start (15 seconds)...
timeout /t 15 /nobreak > nul

REM バックエンドが起動したか確認
curl -s http://localhost:8002/health > nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%[ERROR]%RESET% Backend server failed to start properly!
    echo %YELLOW%[INFO]%RESET% Please check logs/backend.log for error details.
    goto error_exit
) else (
    echo %GREEN%[INFO]%RESET% Backend server is running on port 8002.
)

REM 6. フロントエンドの起動（デバッグモードで）
echo %GREEN%[INFO]%RESET% 6. Starting frontend server...
cd lpm_frontend
start "Second-Me Frontend" cmd /c "npm run dev & pause"
cd ..

REM フロントエンドの起動を待機
echo %GREEN%[INFO]%RESET% Waiting for frontend to start (15 seconds)...
timeout /t 15 /nobreak > nul

REM 7. ブラウザを起動（デバッグページ）
echo %GREEN%[INFO]%RESET% 7. Opening debug page in browser...
start http://localhost:3000/debug

REM 8. 状況モニターと診断情報
echo.
echo %BOLD%%BLUE%====================================================%RESET%
echo %BOLD%%BLUE%      Second-Me Windows - Emergency Monitor        %RESET%
echo %BOLD%%BLUE%====================================================%RESET%
echo.
echo %GREEN%[INFO]%RESET% Emergency diagnostics:
echo   1. Backend health endpoint: http://localhost:8002/health
echo   2. Debug endpoint: http://localhost:8002/api/debug
echo   3. Frontend debug page: http://localhost:3000/debug
echo.
echo %GREEN%[INFO]%RESET% If the connection issues persist, check:
echo   1. Backend log file: logs/backend.log
echo   2. Current directory path for special characters
echo   3. Firewall settings blocking connections
echo   4. Web browser's CORS policy (try Microsoft Edge)
echo.
echo %YELLOW%[NOTE]%RESET% Testing connection from command line:
echo   curl http://localhost:8002/health
echo.
echo %BOLD%To stop all services:%RESET% taskkill /f /fi "WINDOWTITLE eq Second-Me*"
echo.
echo Press any key to exit this monitor (services will continue running)...
pause > nul
exit /b 0

:error_exit
echo.
echo %RED%[ERROR]%RESET% Emergency startup aborted due to critical errors.
echo %YELLOW%[SUGGESTION]%RESET% Try running 'python app.py' directly to see all error messages.
pause
exit /b 1
