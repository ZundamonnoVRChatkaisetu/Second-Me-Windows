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
echo    Second-Me Windows 簡易バックエンド
echo  ================================================
echo.
echo このシンプルなバックエンドはデバッグ用に設計されています。
echo - エラーメッセージを直接確認可能
echo - 最小限の機能のみ実装
echo - ヘルスチェックエンドポイント: http://localhost:%LOCAL_APP_PORT%/health
echo.
echo Ctrl+Cで終了できます。
echo.

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

:: シンプルバックエンドを起動
echo.
echo 簡易バックエンドを起動しています...
echo 以下にログとエラーが表示されます:
echo ---------------------------------------------------
echo.
python simple-backend.py

:end
call %VENV_NAME%\Scripts\deactivate.bat
pause
