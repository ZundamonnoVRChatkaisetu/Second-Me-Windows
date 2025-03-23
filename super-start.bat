@echo off
setlocal enabledelayedexpansion

:: タイトル設定
title Second-Me Windows - スーパースタートツール

:: カラー設定
set "INFO=[92m"
set "WARN=[93m"
set "ERROR=[91m"
set "RESET=[0m"
set "BOLD=[1m"
set "BLUE=[94m"
set "CYAN=[96m"

echo %BOLD%%BLUE%====================================================%RESET%
echo %BOLD%%BLUE%      Second-Me Windows スーパースタートツール      %RESET%
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
call :log "%INFO%[INFO]%RESET% スーパースタート実行開始: %date% %time%"

:: =============================
:: 1. 環境チェック
:: =============================
call :log "%INFO%[INFO]%RESET% 1. 環境診断を開始します..."

:: Node.jsバージョンチェック
call :log "%INFO%[INFO]%RESET% Node.jsバージョンをチェック中..."
node --version > nul 2>&1
if %errorlevel% neq 0 (
    call :log "%ERROR%[ERROR]%RESET% Node.jsがインストールされていません。"
    call :log "%ERROR%[ERROR]%RESET% https://nodejs.org からNode.jsをインストールしてください。"
    goto error_exit
) else (
    for /f "tokens=*" %%a in ('node --version') do set NODE_VERSION=%%a
    call :log "%INFO%[INFO]%RESET% Node.js %NODE_VERSION% が検出されました。"
)

:: npm バージョンチェック
call :log "%INFO%[INFO]%RESET% npmバージョンをチェック中..."
for /f "tokens=*" %%a in ('npm --version') do set NPM_VERSION=%%a
call :log "%INFO%[INFO]%RESET% npm %NPM_VERSION% が検出されました。"

:: Pythonバージョンチェック
call :log "%INFO%[INFO]%RESET% Pythonバージョンをチェック中..."
python --version > nul 2>&1
if %errorlevel% neq 0 (
    call :log "%ERROR%[ERROR]%RESET% Pythonがインストールされていません。"
    call :log "%ERROR%[ERROR]%RESET% https://www.python.org からPythonをインストールしてください。"
    goto error_exit
) else (
    for /f "tokens=*" %%a in ('python --version') do set PYTHON_VERSION=%%a
    call :log "%INFO%[INFO]%RESET% %PYTHON_VERSION% が検出されました。"
)

:: 必要なポートの確認（8002, 8003, 3000）
call :log "%INFO%[INFO]%RESET% 必要なポートの使用状況を確認中..."

:: ポート確認関数
:check_port
    set "PORT=%~1"
    netstat -ano | findstr ":%PORT% " > nul
    if %errorlevel% equ 0 (
        call :log "%WARN%[WARN]%RESET% ポート %PORT% は既に使用されています。解放を試みます..."
        for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":%PORT% "') do (
            set PID=%%p
            call :log "%INFO%[INFO]%RESET% ポート %PORT% を使用しているプロセス(PID: !PID!)を終了します..."
            taskkill /F /PID !PID! > nul 2>&1
            if !errorlevel! equ 0 (
                call :log "%INFO%[INFO]%RESET% プロセスを正常に終了しました。"
            ) else (
                call :log "%WARN%[WARN]%RESET% プロセス終了に失敗しました。手動で終了が必要かもしれません。"
            )
        )
    ) else (
        call :log "%INFO%[INFO]%RESET% ポート %PORT% は利用可能です。"
    )
    exit /b

:: 各ポートの確認
call :check_port 8002
call :check_port 8003
call :check_port 3000

:: アクティブプロファイルファイルの確認
call :log "%INFO%[INFO]%RESET% プロファイル設定を確認中..."
if exist "active_profile.json" (
    call :log "%INFO%[INFO]%RESET% アクティブプロファイル設定ファイルが見つかりました。"
) else (
    call :log "%WARN%[WARN]%RESET% アクティブプロファイル設定ファイルが見つかりません。新規作成されます。"
)

:: プロファイルディレクトリの確認
if not exist "profiles" (
    call :log "%INFO%[INFO]%RESET% プロファイルディレクトリを作成します..."
    mkdir profiles
)

:: =============================
:: 2. 依存関係インストール
:: =============================
call :log "%INFO%[INFO]%RESET% 2. 依存関係をチェックしています..."

:: Pythonパッケージの確認とインストール
call :log "%INFO%[INFO]%RESET% Pythonの依存関係をチェック中..."
pip install -r requirements.txt
if %errorlevel% neq 0 (
    call :log "%WARN%[WARN]%RESET% Pythonパッケージのインストールに問題がありました。"
) else (
    call :log "%INFO%[INFO]%RESET% Pythonパッケージが正常にインストールされました。"
)

:: フロントエンドの依存関係
call :log "%INFO%[INFO]%RESET% フロントエンドの依存関係をチェック中..."
if not exist "lpm_frontend\node_modules" (
    call :log "%INFO%[INFO]%RESET% node_modulesが見つかりません。npmパッケージをインストールします..."
    cd lpm_frontend
    call npm install
    cd ..
    if %errorlevel% neq 0 (
        call :log "%WARN%[WARN]%RESET% npm パッケージのインストールに問題がありました。"
    ) else (
        call :log "%INFO%[INFO]%RESET% npm パッケージが正常にインストールされました。"
    )
) else (
    call :log "%INFO%[INFO]%RESET% フロントエンドの依存関係は既にインストールされています。"
)

:: =============================
:: 3. 環境変数の設定
:: =============================
call :log "%INFO%[INFO]%RESET% 3. 環境変数を設定中..."

:: バックエンドポートの設定
set "LOCAL_APP_PORT=8002"
set "PYTHONIOENCODING=utf-8"
set "NEXT_PUBLIC_BACKEND_URL=http://localhost:8002"

:: フロントエンド環境変数ファイルの確認と作成
if not exist "lpm_frontend\.env.local" (
    call :log "%INFO%[INFO]%RESET% フロントエンド環境変数ファイルを作成します..."
    echo NEXT_PUBLIC_BACKEND_URL=http://localhost:8002 > lpm_frontend\.env.local
) else (
    call :log "%INFO%[INFO]%RESET% フロントエンド環境変数ファイルを更新します..."
    echo NEXT_PUBLIC_BACKEND_URL=http://localhost:8002 > lpm_frontend\.env.local
)

:: =============================
:: 4. サーバー起動
:: =============================
call :log "%INFO%[INFO]%RESET% 4. サーバーを起動中..."

:: バックエンドサーバー起動（バックグラウンド）
call :log "%INFO%[INFO]%RESET% バックエンドサーバーを起動中..."
start "Second-Me Backend" /min cmd /c "python app.py & pause"

:: バックエンドの起動を待機
call :log "%INFO%[INFO]%RESET% バックエンドの起動を待機中 (5秒)..."
timeout /t 5 /nobreak > nul

:: バックエンドが起動しているか確認
call :log "%INFO%[INFO]%RESET% バックエンドの接続テスト中..."
curl -s http://localhost:8002/api/health > nul
if %errorlevel% neq 0 (
    call :log "%WARN%[WARN]%RESET% バックエンドへの接続に失敗しました。再起動を試みます..."
    taskkill /FI "WINDOWTITLE eq Second-Me Backend" /F > nul 2>&1
    start "Second-Me Backend" /min cmd /c "set PYTHONIOENCODING=utf-8 & set LOCAL_APP_PORT=8002 & python app.py & pause"
    timeout /t 5 /nobreak > nul
    
    :: 2回目の確認
    curl -s http://localhost:8002/api/health > nul
    if %errorlevel% neq 0 (
        call :log "%ERROR%[ERROR]%RESET% バックエンドの起動に失敗しました。"
        call :log "%INFO%[INFO]%RESET% 詳細なエラーを確認するために別途バックエンドのみを起動してください: start-backend-only.bat"
    ) else (
        call :log "%INFO%[INFO]%RESET% バックエンドサーバーが正常に起動しました。"
    )
) else (
    call :log "%INFO%[INFO]%RESET% バックエンドサーバーが正常に起動しました。"
)

:: フロントエンドサーバー起動
call :log "%INFO%[INFO]%RESET% フロントエンドサーバーを起動中..."
cd lpm_frontend
start "Second-Me Frontend" /min cmd /c "npm run dev & pause"
cd ..

:: フロントエンドの起動を待機
call :log "%INFO%[INFO]%RESET% フロントエンドの起動を待機中 (10秒)..."
timeout /t 10 /nobreak > nul

:: =============================
:: 5. ブラウザを起動
:: =============================
call :log "%INFO%[INFO]%RESET% 5. ブラウザを起動中..."
start http://localhost:3000

:: =============================
:: 6. エラー監視
:: =============================
call :log "%INFO%[INFO]%RESET% 6. エラー監視を開始します..."
call :log "%INFO%[INFO]%RESET% 全てのサービスが起動しました。"
call :log "%INFO%[INFO]%RESET% サービスURLs:"
call :log "%INFO%[INFO]%RESET% - フロントエンド: http://localhost:3000"
call :log "%INFO%[INFO]%RESET% - バックエンドAPI: http://localhost:8002"
call :log ""
call :log "%INFO%[INFO]%RESET% ログファイル:"
call :log "%INFO%[INFO]%RESET% - バックエンド: logs\backend.log"
call :log "%INFO%[INFO]%RESET% - 起動ログ: %LOG_FILE%"
call :log ""
call :log "%BOLD%%CYAN%エラー発生時のトラブルシューティングガイド:%RESET%"
call :log "1. %BOLD%バックエンド接続エラー:%RESET% start-backend-only.bat を実行して詳細を確認"
call :log "2. %BOLD%プロファイル選択問題:%RESET% active_profile.json ファイルを確認"
call :log "3. %BOLD%フロントエンド表示問題:%RESET% lpm_frontend\.env.local ファイルのURL設定を確認"
call :log ""
call :log "%BOLD%%CYAN%サービスを停止するには:%RESET% taskkill /f /fi \"WINDOWTITLE eq Second-Me*\""
call :log ""

:: エラー監視プロンプト
echo.
echo %BOLD%%BLUE%====================================================%RESET%
echo %BOLD%%BLUE%      Second-Me Windows - エラー監視コンソール      %RESET%
echo %BOLD%%BLUE%====================================================%RESET%
echo.
echo エラーログを確認中...
echo.
echo バックエンドログの最新10行:
type logs\backend.log | findstr /i "error warning exception failed" | tail -10
echo.
echo %BOLD%%CYAN%コマンド一覧:%RESET%
echo  1: バックエンドログ確認
echo  2: ブラウザ再起動
echo  3: サーバー再起動
echo  q: 終了
echo.

:monitor_loop
set /p CHOICE="コマンドを入力してください (1-3, q): "

if "%CHOICE%"=="1" (
    echo.
    echo バックエンドログの最新20行:
    type logs\backend.log | tail -20
    echo.
    goto monitor_loop
)

if "%CHOICE%"=="2" (
    start http://localhost:3000
    echo ブラウザを再起動しました。
    goto monitor_loop
)

if "%CHOICE%"=="3" (
    call :log "%INFO%[INFO]%RESET% サーバーを再起動します..."
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
    
    call :log "%INFO%[INFO]%RESET% サーバーを再起動しました。"
    goto monitor_loop
)

if "%CHOICE%"=="q" (
    call :log "%INFO%[INFO]%RESET% 監視を終了します..."
    goto exit
)

goto monitor_loop

:error_exit
call :log "%ERROR%[ERROR]%RESET% エラーが発生したため起動を中止しました。"
echo.
echo %BOLD%%CYAN%詳細なエラーログ:%RESET% %LOG_FILE%
pause
exit /b 1

:exit
call :log "%INFO%[INFO]%RESET% スーパースタートツールを終了します: %date% %time%"
exit /b 0
