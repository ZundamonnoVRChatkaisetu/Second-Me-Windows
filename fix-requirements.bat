@echo off
echo.
echo  ================================================
echo    Second-Me Windows - Fix Dependencies
echo  ================================================
echo.

echo flask-cors appears to be missing. Installing it now...

if not exist %VENV_NAME% (
    set VENV_NAME=second-me-venv
)

call %VENV_NAME%\Scripts\activate.bat
python -m pip install flask-cors
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install flask-cors.
    exit /b 1
)

echo.
echo [SUCCESS] flask-cors has been successfully installed.
echo.
echo Now you can run 'scripts\start.bat' again.
echo.
call %VENV_NAME%\Scripts\deactivate.bat
