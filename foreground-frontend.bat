@echo off
setlocal

:: Default environment variables
set LOCAL_FRONTEND_PORT=3000

:: Load environment variables from .env if exists
if exist .env (
    for /f "tokens=1,* delims==" %%a in (.env) do (
        if "%%a"=="LOCAL_FRONTEND_PORT" set LOCAL_FRONTEND_PORT=%%b
    )
)

echo.
echo  ================================================
echo    Second-Me Windows フロントエンド（フォアグラウンド）
echo  ================================================
echo.
echo このウィンドウではフロントエンドを直接実行します。
echo 別の新しいウィンドウでバックエンドを起動してください。
echo.
echo バックエンド起動コマンド:
echo   foreground-backend.bat
echo.
echo フロントエンドを起動中...
echo ---------------------------------------------------
echo.

:: ディレクトリ確認
if not exist lpm_frontend (
    echo [ERROR] lpm_frontendディレクトリが見つかりません。
    exit /b 1
)

:: フロントエンドディレクトリに移動
cd lpm_frontend

:: 依存関係を確認
if not exist node_modules (
    echo node_modulesが見つかりません。依存関係をインストールします...
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npmインストールに失敗しました。
        cd ..
        exit /b 1
    )
)

:: フロントエンドを起動（フォアグラウンドで）
npm run dev

:: ここには通常到達しないが、念のため
cd ..
pause
