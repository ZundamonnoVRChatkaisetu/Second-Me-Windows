@echo off
echo.
echo  ================================================
echo    Second-Me Windows - Fix Dependencies
echo  ================================================
echo.

echo flask-corsが不足しているようです。追加インストールします...

if not exist %VENV_NAME% (
    set VENV_NAME=second-me-venv
)

call %VENV_NAME%\Scripts\activate.bat
python -m pip install flask-cors
if %errorlevel% neq 0 (
    echo [ERROR] flask-corsのインストールに失敗しました。
    exit /b 1
)

echo.
echo [SUCCESS] flask-corsが正常にインストールされました。
echo.
echo 次に、'scripts\start.bat'を再実行してください。
echo.
call %VENV_NAME%\Scripts\deactivate.bat
