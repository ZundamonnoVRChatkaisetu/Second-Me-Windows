@echo off
setlocal enabledelayedexpansion

echo.
echo  ================================================
echo    Second-Me Windows - Error Fix and Start
echo  ================================================
echo.

:: デフォルトの環境変数
set VENV_NAME=second-me-venv
set BACKEND_PORT=8002
set FRONTEND_PORT=3000
set CORS_PORT=8003

:: .envファイルから環境変数を読み込む（存在する場合）
if exist .env (
    for /f "tokens=1,* delims==" %%a in (.env) do (
        if "%%a"=="VENV_NAME" set VENV_NAME=%%b
        if "%%a"=="LOCAL_APP_PORT" set BACKEND_PORT=%%b
        if "%%a"=="LOCAL_FRONTEND_PORT" set FRONTEND_PORT=%%b
    )
)

:: 1. 既存のプロセスをクリーンアップ
echo [1/8] 既存のプロセスをクリーンアップしています...
taskkill /f /fi "WINDOWTITLE eq Second-Me Backend" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Second-Me Frontend" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Second-Me CORS Proxy" >nul 2>&1
if exist run\.backend.pid del /f run\.backend.pid >nul 2>&1
if exist run\.frontend.pid del /f run\.frontend.pid >nul 2>&1

:: 2. ポートの競合をチェック
echo [2/8] ポートの競合をチェックしています...
netstat -ano | findstr ":%BACKEND_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [警告] ポート %BACKEND_PORT% は使用中です。解放を試みています...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%BACKEND_PORT% " ^| findstr "LISTENING"') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)

netstat -ano | findstr ":%FRONTEND_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [警告] ポート %FRONTEND_PORT% は使用中です。解放を試みています...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%FRONTEND_PORT% " ^| findstr "LISTENING"') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)

netstat -ano | findstr ":%CORS_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [警告] ポート %CORS_PORT% は使用中です。解放を試みています...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%CORS_PORT% " ^| findstr "LISTENING"') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)

:: 3. フロントエンドの依存関係を再インストール
echo [3/8] フロントエンドの依存関係を再インストールしています...
cd lpm_frontend

echo node_modulesディレクトリを削除しています...
if exist node_modules rmdir /s /q node_modules

echo package-lock.jsonを削除しています...
if exist package-lock.json del /f package-lock.json

echo npmキャッシュをクリアしています...
call npm cache clean --force

echo 依存関係をインストールしています...
call npm install

:: 4. バックエンド接続用のCORSプロキシを設定
echo [4/8] CORS経由のバックエンド接続を設定しています...

:: CORSプロキシ用の.envファイルを作成
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%CORS_PORT% > .env
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%CORS_PORT% > .env.local
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%CORS_PORT% > .env.development
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%CORS_PORT% > .env.development.local

cd ..

:: 5. バックエンドを起動
echo [5/8] バックエンドサービスを起動しています...
start "Second-Me Backend" cmd /k "title Second-Me Backend && color 1f && echo バックエンドがポート %BACKEND_PORT% で起動中... && echo. && %VENV_NAME%\Scripts\activate.bat && python app.py"

:: バックエンドの初期化を待機
echo [6/8] バックエンドの初期化を待機しています...
timeout /t 5 /nobreak > nul

:: 6. CORSプロキシを起動
echo [7/8] CORSプロキシを起動しています...
cd lpm_frontend

:: 必要な依存関係がインストールされていることを確認
if not exist node_modules\express (
    echo [INFO] 必要な依存関係をインストールしています...
    call npm install express http-proxy-middleware cors
)

:: CORSプロキシを起動
start "Second-Me CORS Proxy" cmd /k "title Second-Me CORS Proxy && color 5f && echo CORSプロキシがポート %CORS_PORT% で起動中... && echo. && node public/cors-anywhere.js"

:: 7. フロントエンドを起動
echo [8/8] フロントエンドサービスを起動しています...
start "Second-Me Frontend" cmd /k "title Second-Me Frontend && color 2f && echo フロントエンドがポート %FRONTEND_PORT% で起動中... && echo. && npm run dev"
cd ..

:: ブラウザを自動で開く
echo.
echo ブラウザを起動しています...
timeout /t 5 /nobreak > nul
start http://localhost:%FRONTEND_PORT%

echo.
echo  ================================================
echo    すべてのサービスがCORSプロキシで起動しました！
echo  ================================================
echo.
echo  バックエンド: http://localhost:%BACKEND_PORT%
echo  CORSプロキシ: http://localhost:%CORS_PORT%
echo  フロントエンド: http://localhost:%FRONTEND_PORT%
echo.
echo  問題が解決しない場合：
echo  1. コンソールウィンドウでエラーメッセージを確認
echo  2. progress.mdファイルで詳細な対応方法を確認
echo.
echo  すべてのサービスを停止するには、コマンドウィンドウを閉じるか、次のコマンドを実行：
echo  taskkill /f /fi "WINDOWTITLE eq Second-Me*"
echo.
