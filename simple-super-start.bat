@echo off
title Second-Me Windows - Super Start Tool

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
echo %BOLD%%BLUE%      Second-Me Windows Super Start Tool      %RESET%
echo %BOLD%%BLUE%====================================================%RESET%
echo.

REM ログディレクトリ作成
if not exist "logs" mkdir logs

REM 1. 環境チェック
echo %GREEN%[INFO]%RESET% 1. Starting environment diagnosis...

REM Nodeとnpmのバージョンチェック
echo %GREEN%[INFO]%RESET% Checking Node.js version...
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%[ERROR]%RESET% Node.js is not installed. Please install Node.js from https://nodejs.org
    goto error_exit
) else (
    for /f "tokens=*" %%a in ('node --version') do set NODE_VERSION=%%a
    echo %GREEN%[INFO]%RESET% Node.js %NODE_VERSION% detected.
)

REM Pythonのバージョンチェック
echo %GREEN%[INFO]%RESET% Checking Python version...
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%[ERROR]%RESET% Python is not installed. Please install Python from https://www.python.org
    goto error_exit
) else (
    for /f "tokens=*" %%a in ('python --version') do set PYTHON_VERSION=%%a
    echo %GREEN%[INFO]%RESET% %PYTHON_VERSION% detected.
)

REM 必要なポートの解放
echo %GREEN%[INFO]%RESET% Checking and releasing required ports...

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

REM 2. 依存関係のインストール
echo %GREEN%[INFO]%RESET% 2. Checking dependencies...

REM Pythonパッケージのインストール
echo %GREEN%[INFO]%RESET% Installing Python packages...
pip install -r requirements.txt

REM フロントエンド依存関係のチェック
echo %GREEN%[INFO]%RESET% Checking frontend dependencies...
if not exist "lpm_frontend\node_modules" (
    echo %GREEN%[INFO]%RESET% Installing npm packages...
    cd lpm_frontend
    call npm install
    cd ..
) else (
    echo %GREEN%[INFO]%RESET% Frontend dependencies are already installed.
)

REM 3. 環境変数の設定
echo %GREEN%[INFO]%RESET% 3. Setting environment variables...

REM 環境変数設定
set "LOCAL_APP_PORT=8002"
set "LOG_LEVEL=DEBUG"
set "PYTHONIOENCODING=utf-8"

REM フロントエンド環境変数ファイルの作成
echo %GREEN%[INFO]%RESET% Updating frontend environment variables...
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:8002 > lpm_frontend\.env.local

REM 4. サーバー起動
echo %GREEN%[INFO]%RESET% 4. Starting servers...

REM バックエンドの起動
echo %GREEN%[INFO]%RESET% Starting backend server...
start "Second-Me Backend" cmd /c "set PYTHONIOENCODING=utf-8 & set LOCAL_APP_PORT=8002 & set LOG_LEVEL=DEBUG & python app.py & pause"

REM バックエンドの起動を待機
echo %GREEN%[INFO]%RESET% Waiting for backend to start (10 seconds)...
timeout /t 10 /nobreak > nul

REM バックエンドが起動したか確認
curl -s http://localhost:8002/health > nul 2>&1
if %errorlevel% neq 0 (
    echo %YELLOW%[WARN]%RESET% Backend may not be fully started yet. Will continue anyway.
) else (
    echo %GREEN%[INFO]%RESET% Backend is running on port 8002.
)

REM フロントエンドの起動
echo %GREEN%[INFO]%RESET% Starting frontend server...
cd lpm_frontend
start "Second-Me Frontend" cmd /c "npm run dev & pause"
cd ..

REM フロントエンドの起動を待機
echo %GREEN%[INFO]%RESET% Waiting for frontend to start (15 seconds)...
timeout /t 15 /nobreak > nul

REM 5. ブラウザを起動
echo %GREEN%[INFO]%RESET% 5. Opening browser...
start http://localhost:3000

REM 6. モニタリング情報の表示
echo.
echo %BOLD%%BLUE%====================================================%RESET%
echo %BOLD%%BLUE%      Second-Me Windows - Status Monitor      %RESET%
echo %BOLD%%BLUE%====================================================%RESET%
echo.
echo %GREEN%[INFO]%RESET% All services started.
echo %GREEN%[INFO]%RESET% Service URLs:
echo   - Frontend: http://localhost:3000
echo   - Backend API: http://localhost:8002
echo   - Debug Page: http://localhost:3000/debug
echo.
echo %YELLOW%[NOTE]%RESET% If you encounter connection issues:
echo   1. Check backend log in logs/backend.log
echo   2. Try restarting with 'start-backend-only.bat' to see detailed errors
echo   3. Visit the debug page at http://localhost:3000/debug for connection diagnostics
echo.
echo %BOLD%To stop all services:%RESET% taskkill /f /fi "WINDOWTITLE eq Second-Me*"
echo.
echo Press any key to exit this monitor (services will continue running)...
pause > nul
exit /b 0

:error_exit
echo.
echo %RED%[ERROR]%RESET% Startup aborted due to errors.
pause
exit /b 1
