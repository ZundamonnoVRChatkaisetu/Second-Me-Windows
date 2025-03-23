@echo off
title Second-Me Windows - Profile Setup Tool

REM コードページをUTF-8に設定
chcp 65001 > nul

REM カラー設定（Windows 10以降で有効）
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "RESET=[0m"
set "BOLD=[1m"
set "BLUE=[94m"

echo %BOLD%%BLUE%====================================================%RESET%
echo %BOLD%%BLUE%      Second-Me Windows Profile Setup Tool         %RESET%
echo %BOLD%%BLUE%====================================================%RESET%
echo.

REM 1. プロセスの停止
echo %GREEN%[INFO]%RESET% 1. Stopping all running servers...
taskkill /f /fi "WINDOWTITLE eq Second-Me*" > nul 2>&1
echo %GREEN%[INFO]%RESET% All servers stopped.

REM 2. プロファイルディレクトリのチェック
echo %GREEN%[INFO]%RESET% 2. Checking profiles directory...
if not exist "profiles" (
    echo %YELLOW%[WARN]%RESET% Profiles directory not found, creating it...
    mkdir profiles
    echo %GREEN%[INFO]%RESET% Created profiles directory.
) else (
    echo %GREEN%[INFO]%RESET% Profiles directory exists.
)

REM 3. デフォルトプロファイルの作成
echo %GREEN%[INFO]%RESET% 3. Creating default profile...

REM Pythonスクリプトを実行してプロファイルを作成
python create-default-profile.py

REM 4. ワークスペースディレクトリのチェック
echo %GREEN%[INFO]%RESET% 4. Checking workspace directory...
if not exist "WorkSpace" (
    echo %YELLOW%[WARN]%RESET% WorkSpace directory not found, creating it...
    mkdir WorkSpace
    echo %GREEN%[INFO]%RESET% Created WorkSpace directory.
) else (
    echo %GREEN%[INFO]%RESET% WorkSpace directory exists.
)

REM 5. プロファイル情報ファイルを表示
echo %GREEN%[INFO]%RESET% 5. Profile information file:
if exist "active_profile.json" (
    type active_profile.json
) else (
    echo %RED%[ERROR]%RESET% Active profile file not found!
)

echo.
echo %BOLD%%BLUE%====================================================%RESET%
echo %BOLD%%BLUE%      Profile Setup Complete                       %RESET%
echo %BOLD%%BLUE%====================================================%RESET%
echo.
echo %GREEN%[INFO]%RESET% Now you can restart the application with emergency-start.bat
echo.
echo Press any key to continue...
pause > nul
