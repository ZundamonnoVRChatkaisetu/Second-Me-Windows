@echo off
setlocal enabledelayedexpansion

:: Second-Me Windows Makefile エミュレーション
:: オリジナルのMakefileコマンドと互換性を持つようにするためのスクリプト

if "%1"=="" goto :help

:: コマンド振り分け
if "%1"=="help" goto :help
if "%1"=="setup" goto :setup
if "%1"=="start" goto :start
if "%1"=="stop" goto :stop
if "%1"=="restart" goto :restart
if "%1"=="restart-backend" goto :restart_backend
if "%1"=="restart-force" goto :restart_force
if "%1"=="status" goto :status
if "%1"=="check-env" goto :check_env
if "%1"=="install" goto :install
if "%1"=="test" goto :test
if "%1"=="format" goto :format
if "%1"=="lint" goto :lint
if "%1"=="all" goto :all

echo 不明なコマンド: %1
echo 利用可能なコマンドを表示するには 'make help' を実行してください。
exit /b 1

:help
call scripts\help.bat
exit /b 0

:setup
call scripts\setup.bat %2 %3 %4 %5 %6 %7 %8 %9
exit /b %errorlevel%

:start
call scripts\start.bat %2 %3 %4 %5 %6 %7 %8 %9
exit /b %errorlevel%

:stop
call scripts\stop.bat %2 %3 %4 %5 %6 %7 %8 %9
exit /b %errorlevel%

:restart
call scripts\restart.bat %2 %3 %4 %5 %6 %7 %8 %9
exit /b %errorlevel%

:restart_backend
echo Restarting backend service only...
call scripts\stop.bat
timeout /t 2 /nobreak > nul
call scripts\start.bat --backend-only
exit /b %errorlevel%

:restart_force
echo Force restarting all services and resetting data...
call scripts\stop.bat
:: Clear temporary data if needed
if exist data\temp rd /s /q data\temp
if exist run rd /s /q run
mkdir run 2>nul
call scripts\start.bat
exit /b %errorlevel%

:status
call scripts\status.bat %2 %3 %4 %5 %6 %7 %8 %9
exit /b %errorlevel%

:check_env
call scripts\setup.bat --check-only
exit /b %errorlevel%

:install
:: Conda環境が有効かチェック
conda --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Please activate conda environment first!
    exit /b 1
)

echo Installing project dependencies...
pip install -r requirements.txt
exit /b %errorlevel%

:test
:: Conda環境が有効かチェック
conda --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Please activate conda environment first!
    exit /b 1
)

echo Running tests...
pytest tests
exit /b %errorlevel%

:format
:: Conda環境が有効かチェック
conda --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Please activate conda environment first!
    exit /b 1
)

echo Formatting code...
python -m ruff format lpm_kernel/
exit /b %errorlevel%

:lint
:: Conda環境が有効かチェック
conda --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Please activate conda environment first!
    exit /b 1
)

echo Checking code style...
python -m ruff check lpm_kernel/
exit /b %errorlevel%

:all
:: Conda環境が有効かチェック
conda --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Please activate conda environment first!
    exit /b 1
)

echo Running format, lint and test...
python -m ruff format lpm_kernel/
python -m ruff check lpm_kernel/
pytest tests
exit /b %errorlevel%
