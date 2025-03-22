@echo off
setlocal

:: Default environment variables
set VENV_NAME=second-me-venv
set LOCAL_APP_PORT=8002

:: Load environment variables from .env if exists
if exist .env (
    for /f "tokens=1,* delims==" %%a in (.env) do (
        if "%%a"=="VENV_NAME" set VENV_NAME=%%b
        if "%%a"=="LOCAL_APP_PORT" set LOCAL_APP_PORT=%%b
    )
)

echo.
echo  ================================================
echo    Second-Me Windows バックエンド（フォアグラウンド）
echo  ================================================
echo.
echo このウィンドウではバックエンドを直接実行します。
echo 別の新しいウィンドウでフロントエンドを起動してください。
echo.
echo フロントエンド起動コマンド:
echo   cd lpm_frontend
echo   npm run dev
echo.
echo ブラウザで開くURL: http://localhost:3000
echo.
echo バックエンドはこのウィンドウで動作します。Ctrl+C で終了できます。
echo.
echo バックエンドを起動中...
echo ---------------------------------------------------
echo.

:: フォルダ存在確認
if not exist logs mkdir logs

:: 依存関係をチェック
call %VENV_NAME%\Scripts\activate.bat

:: バックエンドを起動（フォアグラウンドで）
python app.py

:: ここには通常到達しないが、念のため
call %VENV_NAME%\Scripts\deactivate.bat
pause
