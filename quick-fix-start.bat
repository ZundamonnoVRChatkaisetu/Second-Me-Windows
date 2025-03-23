@echo off
title Second-Me Windows - QuickFix Start Tool

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
echo %BOLD%%BLUE%      Second-Me Windows QuickFix Start Tool        %RESET%
echo %BOLD%%BLUE%====================================================%RESET%
echo.

REM 1. 実行中のプロセスを強制終了
echo %YELLOW%[WARN]%RESET% 1. 既存のSecond-Meプロセスを終了しています...
taskkill /f /fi "WINDOWTITLE eq Second-Me*" > nul 2>&1

REM 2. ポートの解放
echo %GREEN%[INFO]%RESET% 2. ポート8002と3000を解放しています...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr ":8002" ^| findstr "LISTENING"') DO (
  echo %YELLOW%[WARN]%RESET% ポート8002を使用しているプロセス(PID:%%P)を終了しています...
  taskkill /F /PID %%P > nul 2>&1
)

FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') DO (
  echo %YELLOW%[WARN]%RESET% ポート3000を使用しているプロセス(PID:%%P)を終了しています...
  taskkill /F /PID %%P > nul 2>&1
)

REM 3. 重要な環境変数を設定
echo %GREEN%[INFO]%RESET% 3. 環境変数を設定しています...
set "LOCAL_APP_PORT=8002"
set "LOG_LEVEL=INFO"
set "PYTHONIOENCODING=utf-8"

REM 4. フロントエンド環境変数を設定
echo %GREEN%[INFO]%RESET% 4. フロントエンド環境変数を設定しています...
if not exist "lpm_frontend" (
    echo %RED%[ERROR]%RESET% フロントエンドディレクトリが見つかりません。
    goto error_exit
)

echo NEXT_PUBLIC_BACKEND_URL=http://localhost:8002 > lpm_frontend\.env.local
echo %GREEN%[INFO]%RESET% .env.local ファイルを更新しました。

REM 5. 必須フォルダの作成
echo %GREEN%[INFO]%RESET% 5. 必須ディレクトリを作成しています...
if not exist "logs" mkdir logs
if not exist "models" mkdir models
if not exist "profiles" mkdir profiles
if not exist "uploads" mkdir uploads
if not exist "WorkSpace" mkdir WorkSpace

REM 6. バックエンドを起動
echo %GREEN%[INFO]%RESET% 6. バックエンドサーバーを起動しています...
start "Second-Me Backend" cmd /c "set LOCAL_APP_PORT=8002 & set LOG_LEVEL=INFO & set PYTHONIOENCODING=utf-8 & python app.py"

REM バックエンドの起動を待機
echo %GREEN%[INFO]%RESET% バックエンドの起動を待機しています (10秒)...
timeout /t 10 /nobreak > nul

REM 7. フロントエンドを起動
echo %GREEN%[INFO]%RESET% 7. フロントエンドを起動しています...
cd lpm_frontend
start "Second-Me Frontend" cmd /c "npm run dev"
cd ..

REM フロントエンドの起動を待機
echo %GREEN%[INFO]%RESET% フロントエンドの起動を待機しています (15秒)...
timeout /t 15 /nobreak > nul

REM 8. バックエンドの状態を確認
echo %GREEN%[INFO]%RESET% 8. バックエンドの状態を確認しています...
curl -s http://localhost:8002/health > nul
if %errorlevel% neq 0 (
    echo %RED%[ERROR]%RESET% バックエンドが応答していません。
    echo %YELLOW%[INFO]%RESET% 少し長く待ってみてください...
    timeout /t 10 /nobreak > nul
    curl -s http://localhost:8002/health > nul
    if %errorlevel% neq 0 (
        echo %RED%[ERROR]%RESET% バックエンドが起動していないようです。logs/backend.logを確認してください。
    ) else (
        echo %GREEN%[INFO]%RESET% バックエンドが応答しています。
    )
) else (
    echo %GREEN%[INFO]%RESET% バックエンドが正常に応答しています。
)

REM 9. ブラウザを開く
echo %GREEN%[INFO]%RESET% 9. ブラウザを起動しています...
timeout /t 5 /nobreak > nul
start http://localhost:3000

REM 10. ステータス表示
echo.
echo %BOLD%%BLUE%====================================================%RESET%
echo %BOLD%%BLUE%      Second-Me Windows - クイックフィックス完了    %RESET%
echo %BOLD%%BLUE%====================================================%RESET%
echo.
echo %GREEN%[INFO]%RESET% サービスURLs:
echo   - フロントエンド: http://localhost:3000
echo   - バックエンドAPI: http://localhost:8002
echo   - デバッグページ: http://localhost:3000/debug
echo.
echo %YELLOW%[NOTE]%RESET% 問題が解決しない場合:
echo   1. デバッグページでバックエンド接続をテストしてください。
echo   2. logs/backend.log ファイルでエラーを確認してください。
echo   3. ファイアウォール設定を確認してください。
echo.
echo %BOLD%すべてのサービスを停止するには:%RESET% taskkill /f /fi "WINDOWTITLE eq Second-Me*"
echo.
echo 任意のキーを押すと、このウィンドウを閉じます (サービスは実行を継続します)...
pause > nul
exit /b 0

:error_exit
echo.
echo %RED%[ERROR]%RESET% クイックフィックス起動に失敗しました。
echo 詳細なエラーメッセージを確認するには、直接 'python app.py' を実行してください。
pause
exit /b 1
