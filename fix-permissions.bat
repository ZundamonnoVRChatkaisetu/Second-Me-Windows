@echo off
setlocal

echo.
echo  ================================================
echo    Second-Me Windows パーミッション修復ツール
echo  ================================================
echo.
echo このスクリプトはディレクトリとファイルの権限を修正し、
echo ポート競合の確認とプロセスのクリーンアップを行います。
echo.
echo 1. ログディレクトリの作成確認
echo 2. バックエンドプロセスのクリーンアップ
echo 3. ポート競合のチェックと解決
echo.

:: 管理者権限の確認
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [警告] このスクリプトは管理者権限なしで実行されています。
    echo        一部の操作は制限される可能性があります。
    echo.
    pause
)

:: ログディレクトリの権限修正
echo [実行] ログディレクトリの確認...
if not exist logs (
    mkdir logs
    echo [情報] logsディレクトリを作成しました。
) else (
    echo [情報] logsディレクトリは既に存在します。
)

:: runディレクトリの権限修正
echo [実行] runディレクトリの確認...
if not exist run (
    mkdir run
    echo [情報] runディレクトリを作成しました。
) else (
    echo [情報] runディレクトリは既に存在します。
)

:: バックエンドプロセスのクリーンアップ
echo [実行] バックエンドプロセスのクリーンアップ...
taskkill /f /fi "WINDOWTITLE eq Second-Me Backend" >nul 2>&1
if %errorlevel% equ 0 (
    echo [情報] バックエンドプロセスを終了しました。
) else (
    echo [情報] 実行中のバックエンドプロセスはありませんでした。
)

:: フロントエンドプロセスのクリーンアップ
echo [実行] フロントエンドプロセスのクリーンアップ...
taskkill /f /fi "WINDOWTITLE eq Second-Me Frontend" >nul 2>&1
if %errorlevel% equ 0 (
    echo [情報] フロントエンドプロセスを終了しました。
) else (
    echo [情報] 実行中のフロントエンドプロセスはありませんでした。
)

:: PID ファイルの削除
echo [実行] PIDファイルの削除...
if exist run\.backend.pid del /f run\.backend.pid
if exist run\.frontend.pid del /f run\.frontend.pid

:: ポート競合チェック
echo [実行] ポート競合のチェック...

:: 8002ポートのチェック
echo [実行] バックエンドポート (8002) のチェック...
netstat -ano | findstr ":8002" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [警告] ポート 8002 は既に使用されています。
    echo        ポートを開放しますか？ (Y/N)
    choice /c YN
    if !errorlevel! equ 1 (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8002" ^| findstr "LISTENING"') do (
            echo [実行] PID %%a のプロセスを終了しています...
            taskkill /f /pid %%a >nul 2>&1
            if !errorlevel! equ 0 (
                echo [情報] ポート 8002 を開放しました。
            ) else (
                echo [エラー] プロセスの終了に失敗しました。管理者権限で再実行してください。
            )
        )
    )
) else (
    echo [情報] ポート 8002 は利用可能です。
)

:: 3000ポートのチェック
echo [実行] フロントエンドポート (3000) のチェック...
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [警告] ポート 3000 は既に使用されています。
    echo        ポートを開放しますか？ (Y/N)
    choice /c YN
    if !errorlevel! equ 1 (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
            echo [実行] PID %%a のプロセスを終了しています...
            taskkill /f /pid %%a >nul 2>&1
            if !errorlevel! equ 0 (
                echo [情報] ポート 3000 を開放しました。
            ) else (
                echo [エラー] プロセスの終了に失敗しました。管理者権限で再実行してください。
            )
        )
    )
) else (
    echo [情報] ポート 3000 は利用可能です。
)

echo.
echo [実行] セットアップが完了しました。
echo        次のコマンドでフォアグラウンドモードでアプリケーションを起動できます：
echo.
echo        バックエンド: foreground-backend.bat
echo        フロントエンド: foreground-frontend.bat
echo.
echo        または通常モードで起動：
echo        scripts\start.bat --skip-health-check
echo.

pause
