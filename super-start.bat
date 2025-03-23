@echo off
setlocal enabledelayedexpansion

:: UTF-8コードページに設定
chcp 65001 > nul

:: タイトル設定
title Second-Me Windows - Super Start Tool

:: カラー設定
set "INFO=[92m"
set "WARN=[93m"
set "ERROR=[91m"
set "RESET=[0m"
set "BOLD=[1m"
set "BLUE=[94m"
set "CYAN=[96m"

echo %BOLD%%BLUE%====================================================%RESET%
echo %BOLD%%BLUE%      Second-Me Windows Super Start Tool      %RESET%
echo %BOLD%%BLUE%====================================================%RESET%
echo.

:: ログディレクトリの作成
if not exist "logs" mkdir logs
set "LOG_FILE=logs\super-start-%date:~0,4%%date:~5,2%%date:~8,2%-%time:~0,2%%time:~3,2%%time:~6,2%.log"
set "LOG_FILE=%LOG_FILE: =0%"

:: ログ関数
:log
    echo %~1 >> "%LOG_FILE%"
    echo %~1
    exit /b

:: 開始時間の記録
call :log "%INFO%[INFO]%RESET% Super Start execution started: %date% %time%"

:: =============================
:: 1. 環境チェック
:: =============================
call :log "%INFO%[INFO]%RESET% 1. Starting environment diagnosis..."

:: Node.jsバージョンチェック
call :log "%INFO%[INFO]%RESET% Checking Node.js version..."
node --version > nul 2>&1
if %errorlevel% neq 0 (
    call :log "%ERROR%[ERROR]%RESET% Node.js is not installed."
    call :log "%ERROR%[ERROR]%RESET% Please install Node.js from https://nodejs.org."
    goto error_exit
) else (
    for /f "tokens=*" %%a in ('node --version') do set NODE_VERSION=%%a
    call :log "%INFO%[INFO]%RESET% Node.js %NODE_VERSION% detected."
)

:: npm バージョンチェック
call :log "%INFO%[INFO]%RESET% Checking npm version..."
for /f "tokens=*" %%a in ('npm --version') do set NPM_VERSION=%%a
call :log "%INFO%[INFO]%RESET% npm %NPM_VERSION% detected."

:: Pythonバージョンチェック
call :log "%INFO%[INFO]%RESET% Checking Python version..."
python --version > nul 2>&1
if %errorlevel% neq 0 (
    call :log "%ERROR%[ERROR]%RESET% Python is not installed."
    call :log "%ERROR%[ERROR]%RESET% Please install Python from https://www.python.org."
    goto error_exit
) else (
    for /f "tokens=*" %%a in ('python --version') do set PYTHON_VERSION=%%a
    call :log "%INFO%[INFO]%RESET% %PYTHON_VERSION% detected."
)

:: 必要なポートの確認（8002, 8003, 3000）
call :log "%INFO%[INFO]%RESET% Checking required ports..."

:: ポート確認関数
:check_port
    set "PORT=%~1"
    netstat -ano | findstr ":%PORT% " > nul
    if %errorlevel% equ 0 (
        call :log "%WARN%[WARN]%RESET% Port %PORT% is already in use. Attempting to release..."
        for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":%PORT% "') do (
            set PID=%%p
            call :log "%INFO%[INFO]%RESET% Terminating process (PID: !PID!) using port %PORT%..."
            taskkill /F /PID !PID! > nul 2>&1
            if !errorlevel! equ 0 (
                call :log "%INFO%[INFO]%RESET% Process terminated successfully."
            ) else (
                call :log "%WARN%[WARN]%RESET% Failed to terminate process. Manual termination may be required."
            )
        )
    ) else (
        call :log "%INFO%[INFO]%RESET% Port %PORT% is available."
    )
    exit /b

:: 各ポートの確認
call :check_port 8002
call :check_port 8003
call :check_port 3000

:: アクティブプロファイルファイルの確認
call :log "%INFO%[INFO]%RESET% Checking profile settings..."
if exist "active_profile.json" (
    call :log "%INFO%[INFO]%RESET% Active profile settings file found."
) else (
    call :log "%WARN%[WARN]%RESET% Active profile settings file not found. Will be created as needed."
)

:: プロファイルディレクトリの確認
if not exist "profiles" (
    call :log "%INFO%[INFO]%RESET% Creating profiles directory..."
    mkdir profiles
)

:: =============================
:: 2. 依存関係インストール
:: =============================
call :log "%INFO%[INFO]%RESET% 2. Checking dependencies..."

:: Pythonパッケージの確認とインストール
call :log "%INFO%[INFO]%RESET% Checking Python dependencies..."
pip install -r requirements.txt
if %errorlevel% neq 0 (
    call :log "%WARN%[WARN]%RESET% There was an issue installing Python packages."
) else (
    call :log "%INFO%[INFO]%RESET% Python packages installed successfully."
)

:: フロントエンドの依存関係
call :log "%INFO%[INFO]%RESET% Checking frontend dependencies..."
if not exist "lpm_frontend\node_modules" (
    call :log "%INFO%[INFO]%RESET% node_modules not found. Installing npm packages..."
    cd lpm_frontend
    call npm install
    cd ..
    if %errorlevel% neq 0 (
        call :log "%WARN%[WARN]%RESET% There was an issue installing npm packages."
    ) else (
        call :log "%INFO%[INFO]%RESET% npm packages installed successfully."
    )
) else (
    call :log "%INFO%[INFO]%RESET% Frontend dependencies are already installed."
)

:: =============================
:: 3. 環境変数の設定
:: =============================
call :log "%INFO%[INFO]%RESET% 3. Setting environment variables..."

:: バックエンドポートの設定
set "LOCAL_APP_PORT=8002"
set "PYTHONIOENCODING=utf-8"
set "NEXT_PUBLIC_BACKEND_URL=http://localhost:8002"

:: フロントエンド環境変数ファイルの確認と作成
if not exist "lpm_frontend\.env.local" (
    call :log "%INFO%[INFO]%RESET% Creating frontend environment variables file..."
    echo NEXT_PUBLIC_BACKEND_URL=http://localhost:8002 > lpm_frontend\.env.local
) else (
    call :log "%INFO%[INFO]%RESET% Updating frontend environment variables file..."
    echo NEXT_PUBLIC_BACKEND_URL=http://localhost:8002 > lpm_frontend\.env.local
)

:: =============================
:: 4. サーバー起動
:: =============================
call :log "%INFO%[INFO]%RESET% 4. Starting servers..."

:: バックエンドサーバー起動（バックグラウンド）
call :log "%INFO%[INFO]%RESET% Starting backend server..."
start "Second-Me Backend" /min cmd /c "set PYTHONIOENCODING=utf-8 & set LOCAL_APP_PORT=8002 & python app.py & pause"

:: バックエンドの起動を待機
call :log "%INFO%[INFO]%RESET% Waiting for backend to start (5 seconds)..."
timeout /t 5 /nobreak > nul

:: バックエンドが起動しているか確認
call :log "%INFO%[INFO]%RESET% Testing backend connection..."
curl -s http://localhost:8002/api/health > nul
if %errorlevel% neq 0 (
    call :log "%WARN%[WARN]%RESET% Failed to connect to backend. Attempting restart..."
    taskkill /FI "WINDOWTITLE eq Second-Me Backend" /F > nul 2>&1
    start "Second-Me Backend" /min cmd /c "set PYTHONIOENCODING=utf-8 & set LOCAL_APP_PORT=8002 & python app.py & pause"
    timeout /t 5 /nobreak > nul
    
    :: 2回目の確認
    curl -s http://localhost:8002/api/health > nul
    if %errorlevel% neq 0 (
        call :log "%ERROR%[ERROR]%RESET% Failed to start backend server."
        call :log "%INFO%[INFO]%RESET% To see detailed errors, please run: start-backend-only.bat"
    ) else (
        call :log "%INFO%[INFO]%RESET% Backend server started successfully."
    )
) else (
    call :log "%INFO%[INFO]%RESET% Backend server started successfully."
)

:: フロントエンドサーバー起動
call :log "%INFO%[INFO]%RESET% Starting frontend server..."
cd lpm_frontend
start "Second-Me Frontend" /min cmd /c "npm run dev & pause"
cd ..

:: フロントエンドの起動を待機
call :log "%INFO%[INFO]%RESET% Waiting for frontend to start (10 seconds)..."
timeout /t 10 /nobreak > nul

:: =============================
:: 5. ブラウザを起動
:: =============================
call :log "%INFO%[INFO]%RESET% 5. Starting browser..."
start http://localhost:3000

:: =============================
:: 6. エラー監視
:: =============================
call :log "%INFO%[INFO]%RESET% 6. Starting error monitoring..."
call :log "%INFO%[INFO]%RESET% All services started."
call :log "%INFO%[INFO]%RESET% Service URLs:"
call :log "%INFO%[INFO]%RESET% - Frontend: http://localhost:3000"
call :log "%INFO%[INFO]%RESET% - Backend API: http://localhost:8002"
call :log ""
call :log "%INFO%[INFO]%RESET% Log files:"
call :log "%INFO%[INFO]%RESET% - Backend: logs\backend.log"
call :log "%INFO%[INFO]%RESET% - Startup log: %LOG_FILE%"
call :log ""
call :log "%BOLD%%CYAN%Troubleshooting guide:%RESET%"
call :log "1. %BOLD%Backend connection error:%RESET% Run start-backend-only.bat for details"
call :log "2. %BOLD%Profile selection issue:%RESET% Check active_profile.json file"
call :log "3. %BOLD%Frontend display issue:%RESET% Check URL settings in lpm_frontend\.env.local"
call :log ""
call :log "%BOLD%%CYAN%To stop all services:%RESET% taskkill /f /fi \"WINDOWTITLE eq Second-Me*\""
call :log ""

:: エラー監視プロンプト
echo.
echo %BOLD%%BLUE%====================================================%RESET%
echo %BOLD%%BLUE%      Second-Me Windows - Error Monitor Console      %RESET%
echo %BOLD%%BLUE%====================================================%RESET%
echo.
echo Checking error logs...
echo.
echo Latest 10 lines from backend log:
type logs\backend.log 2>nul | findstr /i "error warning exception failed" | tail -10
echo.
echo %BOLD%%CYAN%Command list:%RESET%
echo  1: Check backend logs
echo  2: Restart browser
echo  3: Restart servers
echo  q: Exit
echo.

:monitor_loop
set /p CHOICE="Enter command (1-3, q): "

if "%CHOICE%"=="1" (
    echo.
    echo Latest 20 lines from backend log:
    type logs\backend.log 2>nul | tail -20
    echo.
    goto monitor_loop
)

if "%CHOICE%"=="2" (
    start http://localhost:3000
    echo Browser restarted.
    goto monitor_loop
)

if "%CHOICE%"=="3" (
    call :log "%INFO%[INFO]%RESET% Restarting servers..."
    taskkill /f /fi "WINDOWTITLE eq Second-Me*" > nul 2>&1
    timeout /t 2 /nobreak > nul
    
    :: バックエンド再起動
    start "Second-Me Backend" /min cmd /c "set PYTHONIOENCODING=utf-8 & set LOCAL_APP_PORT=8002 & python app.py & pause"
    timeout /t 5 /nobreak > nul
    
    :: フロントエンド再起動
    cd lpm_frontend
    start "Second-Me Frontend" /min cmd /c "npm run dev & pause"
    cd ..
    
    timeout /t 5 /nobreak > nul
    start http://localhost:3000
    
    call :log "%INFO%[INFO]%RESET% Servers restarted."
    goto monitor_loop
)

if "%CHOICE%"=="q" (
    call :log "%INFO%[INFO]%RESET% Ending monitoring..."
    goto exit
)

goto monitor_loop

:error_exit
call :log "%ERROR%[ERROR]%RESET% Startup aborted due to errors."
echo.
echo %BOLD%%CYAN%Detailed error log:%RESET% %LOG_FILE%
pause
exit /b 1

:exit
call :log "%INFO%[INFO]%RESET% Super Start Tool exiting: %date% %time%"
exit /b 0
