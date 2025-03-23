@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo Second Me - Windows クイックフィックス起動スクリプト
echo ===================================================

REM 環境設定
set PORT=8002
set FRONTEND_PORT=3000
set VENV_NAME=second-me-venv
if exist .env (
  for /F "tokens=1,2 delims==" %%a in (.env) do (
    if "%%a"=="VENV_NAME" set VENV_NAME=%%b
    if "%%a"=="LOCAL_APP_PORT" set PORT=%%b
  )
)

REM 既存のポート使用状況を確認
echo ポートの使用状況を確認しています...
set PORT_IN_USE=0
netstat -ano | findstr :%PORT% > nul
if %ERRORLEVEL% EQU 0 (
  set PORT_IN_USE=1
  echo 警告: ポート %PORT% は既に使用されています。プロセスの終了を試みます。
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT%') do (
    echo PID %%a のプロセスを終了しています...
    taskkill /F /PID %%a > nul 2>&1
  )
)

REM フロントエンドポートの確認
set FRONTEND_PORT_IN_USE=0
netstat -ano | findstr :%FRONTEND_PORT% > nul
if %ERRORLEVEL% EQU 0 (
  set FRONTEND_PORT_IN_USE=1
  echo 警告: ポート %FRONTEND_PORT% は既に使用されています。プロセスの終了を試みます。
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%FRONTEND_PORT%') do (
    echo PID %%a のプロセスを終了しています...
    taskkill /F /PID %%a > nul 2>&1
  )
)

REM 環境変数のクリーンアップ
echo 環境変数をクリーンアップしています...
set LOG_LEVEL=INFO
set DEBUG=1

echo ディレクトリ構造を確認しています...
if not exist logs mkdir logs
if not exist profiles mkdir profiles
if not exist models mkdir models
if not exist WorkSpace mkdir WorkSpace
if not exist uploads mkdir uploads

REM 仮想環境の確認
echo 仮想環境を確認しています...
if not exist %VENV_NAME%\Scripts\activate.bat (
  echo 仮想環境が見つかりません。セットアップスクリプトを実行してください。
  exit /b 1
)

REM バックエンドの起動
echo バックエンドサーバーを起動しています...
start cmd /k "title Second Me Backend && color 0A && call %VENV_NAME%\Scripts\activate.bat && python app.py"

REM 起動待機
echo バックエンドサーバーの起動を待機中 (5秒)...
ping 127.0.0.1 -n 6 > nul

REM バックエンド接続テスト
echo バックエンド接続をテストしています...
curl -s http://localhost:%PORT%/health > nul
if %ERRORLEVEL% NEQ 0 (
  echo 警告: バックエンド接続テストに失敗しました。サーバーが起動しているか確認してください。
  echo バックエンドの起動を再試行します...
  timeout /t 3 > nul
  start cmd /k "title Second Me Backend (Retry) && color 0E && call %VENV_NAME%\Scripts\activate.bat && python app.py"
  ping 127.0.0.1 -n 6 > nul
)

REM フロントエンドの起動
echo フロントエンドサーバーを起動しています...
cd lpm_frontend
start cmd /k "title Second Me Frontend && color 0B && npm run dev"
cd ..

REM 起動成功メッセージ
echo ===================================================
echo Second Me Windows が起動しました！
echo ブラウザで http://localhost:%FRONTEND_PORT% にアクセスしてください。
echo 接続問題がある場合は http://localhost:%FRONTEND_PORT%/debug にアクセスしてください。
echo ===================================================

REM ブラウザで開く
timeout /t 5 > nul
start http://localhost:%FRONTEND_PORT%/debug

endlocal
