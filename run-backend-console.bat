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
echo    Second-Me Windows Backend Direct Console
echo  ================================================
echo.
echo この画面でバックエンドを直接起動します。エラーが表示されたら確認してください。
echo Ctrl+Cで終了できます。
echo.

:: フォルダが存在するか確認
if not exist logs mkdir logs

:: 依存関係をチェック
call %VENV_NAME%\Scripts\activate.bat
python -c "import flask_cors" 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] flask-corsモジュールが見つかりません。インストールします...
    python -m pip install flask-cors
    if %errorlevel% neq 0 (
        echo [ERROR] flask-corsのインストールに失敗しました。
        goto :end
    )
    echo [SUCCESS] flask-corsがインストールされました。
)

:: 直接バックエンドを起動（コンソール出力を表示）
echo.
echo バックエンドを直接起動しています...
echo 以下にエラーメッセージがあれば確認してください:
echo ---------------------------------------------------
echo.
python app.py

:end
call %VENV_NAME%\Scripts\deactivate.bat
pause
