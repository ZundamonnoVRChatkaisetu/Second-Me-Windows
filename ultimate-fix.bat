@echo off
setlocal enabledelayedexpansion

echo.
echo  ================================================
echo    Second-Me Windows - Ultimate Fix Script
echo  ================================================
echo.

:: デフォルトの環境変数
set VENV_NAME=second-me-venv
set BACKEND_PORT=8002
set FRONTEND_PORT=3000
set CORS_PORT=8003

:: .envファイルから環境変数を読み込む（存在する場合）
if exist .env (
    for /f "tokens=1,* delims==" %%a in (.env) do (
        if "%%a"=="VENV_NAME" set VENV_NAME=%%b
        if "%%a"=="LOCAL_APP_PORT" set BACKEND_PORT=%%b
        if "%%a"=="LOCAL_FRONTEND_PORT" set FRONTEND_PORT=%%b
    )
)

:: Node.jsプロキシ用の環境変数をエクスポート
set NODE_ENV=development
set BACKEND_PORT=%BACKEND_PORT%
set CORS_PORT=%CORS_PORT%

:: 1. 必要なフォルダの確認
if not exist logs mkdir logs
if not exist run mkdir run

:: 2. 既存のプロセスをクリーンアップ
echo [1/9] 既存のプロセスをクリーンアップしています...
taskkill /f /fi "WINDOWTITLE eq Second-Me Backend" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Second-Me Frontend" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Second-Me CORS Proxy" >nul 2>&1
if exist run\.backend.pid del /f run\.backend.pid >nul 2>&1
if exist run\.frontend.pid del /f run\.frontend.pid >nul 2>&1

:: 3. ポートの競合をチェック
echo [2/9] ポートの競合をチェックしています...
netstat -ano | findstr ":%BACKEND_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [警告] ポート %BACKEND_PORT% は使用中です。解放を試みています...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%BACKEND_PORT% " ^| findstr "LISTENING"') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)

netstat -ano | findstr ":%FRONTEND_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [警告] ポート %FRONTEND_PORT% は使用中です。解放を試みています...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%FRONTEND_PORT% " ^| findstr "LISTENING"') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)

netstat -ano | findstr ":%CORS_PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [警告] ポート %CORS_PORT% は使用中です。解放を試みています...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%CORS_PORT% " ^| findstr "LISTENING"') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)

:: 4. CORS経由のバックエンド接続を設定
echo [3/9] CORS経由のバックエンド接続を設定しています...
if not exist lpm_frontend (
    echo [エラー] フロントエンドディレクトリが見つかりません！
    exit /b 1
)

:: CORSプロキシ向けの.envファイルを作成
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%CORS_PORT% > lpm_frontend\.env
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%CORS_PORT% > lpm_frontend\.env.local
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%CORS_PORT% > lpm_frontend\.env.development
echo NEXT_PUBLIC_BACKEND_URL=http://localhost:%CORS_PORT% > lpm_frontend\.env.development.local

:: 5. CORSプロキシスクリプトを作成/更新
echo [4/9] CORSプロキシスクリプトを作成/更新しています...
cd lpm_frontend

:: 要求される依存関係がインストールされていることを確認
if not exist node_modules\express (
    echo [情報] 必要な依存関係をインストールしています...
    call npm install express http-proxy-middleware cors
)

:: ディレクトリを確認
if not exist public mkdir public

:: 既存のCORSプロキシスクリプトを削除して新しいものを作成
if exist public\cors-anywhere.js del /f public\cors-anywhere.js

echo // CORSプロキシ サーバー - Second-Me Windows用 > public\cors-anywhere.js
echo const express = require('express'); >> public\cors-anywhere.js
echo const httpProxy = require('http-proxy-middleware'); >> public\cors-anywhere.js
echo const createProxyMiddleware = httpProxy.createProxyMiddleware; >> public\cors-anywhere.js
echo. >> public\cors-anywhere.js
echo // 環境変数を読み込む >> public\cors-anywhere.js
echo const BACKEND_PORT = process.env.BACKEND_PORT || 8002; >> public\cors-anywhere.js
echo const CORS_PORT = process.env.CORS_PORT || 8003; >> public\cors-anywhere.js
echo. >> public\cors-anywhere.js
echo console.log('環境設定:'); >> public\cors-anywhere.js
echo console.log(`  バックエンドポート: ${BACKEND_PORT}`); >> public\cors-anywhere.js
echo console.log(`  CORSプロキシポート: ${CORS_PORT}`); >> public\cors-anywhere.js
echo. >> public\cors-anywhere.js
echo const app = express(); >> public\cors-anywhere.js
echo. >> public\cors-anywhere.js
echo // リクエスト情報をロギング >> public\cors-anywhere.js
echo app.use((req, res, next) =^> { >> public\cors-anywhere.js
echo   const timestamp = new Date().toISOString(); >> public\cors-anywhere.js
echo   console.log(`[${timestamp}] ${req.method} ${req.url}`); >> public\cors-anywhere.js
echo   next(); >> public\cors-anywhere.js
echo }); >> public\cors-anywhere.js
echo. >> public\cors-anywhere.js
echo // CORSヘッダーを追加する関数 >> public\cors-anywhere.js
echo app.use((req, res, next) =^> { >> public\cors-anywhere.js
echo   res.header('Access-Control-Allow-Origin', '*'); >> public\cors-anywhere.js
echo   res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS'); >> public\cors-anywhere.js
echo   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin'); >> public\cors-anywhere.js
echo   res.header('Access-Control-Max-Age', '3600'); >> public\cors-anywhere.js
echo. >> public\cors-anywhere.js
echo   // preflightリクエストを処理 >> public\cors-anywhere.js
echo   if (req.method === 'OPTIONS') { >> public\cors-anywhere.js
echo     return res.status(200).end(); >> public\cors-anywhere.js
echo   } >> public\cors-anywhere.js
echo. >> public\cors-anywhere.js
echo   next(); >> public\cors-anywhere.js
echo }); >> public\cors-anywhere.js
echo. >> public\cors-anywhere.js
echo // APIリクエストをバックエンドにプロキシする >> public\cors-anywhere.js
echo const apiProxy = createProxyMiddleware({ >> public\cors-anywhere.js
echo   target: `http://localhost:${BACKEND_PORT}`, >> public\cors-anywhere.js
echo   changeOrigin: true, >> public\cors-anywhere.js
echo   pathRewrite: { >> public\cors-anywhere.js
echo     '^/api': '/api', // パスの書き換えなし >> public\cors-anywhere.js
echo   }, >> public\cors-anywhere.js
echo   onProxyReq: (proxyReq, req, res) =^> { >> public\cors-anywhere.js
echo     // リクエストヘッダーを追加する必要がある場合 >> public\cors-anywhere.js
echo     proxyReq.setHeader('X-Forwarded-By', 'CORS-Proxy'); >> public\cors-anywhere.js
echo     console.log(`プロキシリクエスト: ${req.method} ${req.url}`); >> public\cors-anywhere.js
echo   }, >> public\cors-anywhere.js
echo   onProxyRes: (proxyRes, req, res) =^> { >> public\cors-anywhere.js
echo     // CORS関連のヘッダーを追加 >> public\cors-anywhere.js
echo     proxyRes.headers['Access-Control-Allow-Origin'] = '*'; >> public\cors-anywhere.js
echo     proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, PUT, POST, DELETE, OPTIONS'; >> public\cors-anywhere.js
echo     proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin'; >> public\cors-anywhere.js
echo     console.log(`バックエンドからのレスポンス: ${proxyRes.statusCode} ${req.method} ${req.url}`); >> public\cors-anywhere.js
echo   }, >> public\cors-anywhere.js
echo   onError: (err, req, res) =^> { >> public\cors-anywhere.js
echo     console.error('プロキシエラー:', err); >> public\cors-anywhere.js
echo     res.status(500).json({ >> public\cors-anywhere.js
echo       error: 'バックエンドサービスに接続できませんでした。サービスが実行中か確認してください。', >> public\cors-anywhere.js
echo       code: 'ECONNREFUSED' >> public\cors-anywhere.js
echo     }); >> public\cors-anywhere.js
echo   } >> public\cors-anywhere.js
echo }); >> public\cors-anywhere.js
echo. >> public\cors-anywhere.js
echo // ヘルスチェックエンドポイント >> public\cors-anywhere.js
echo app.get('/health', (req, res) =^> { >> public\cors-anywhere.js
echo   res.status(200).json({ >> public\cors-anywhere.js
echo     status: 'ok', >> public\cors-anywhere.js
echo     service: 'cors-proxy', >> public\cors-anywhere.js
echo     timestamp: new Date().toISOString() >> public\cors-anywhere.js
echo   }); >> public\cors-anywhere.js
echo }); >> public\cors-anywhere.js
echo. >> public\cors-anywhere.js
echo // プロキシミドルウェアを設定 >> public\cors-anywhere.js
echo app.use('/api', apiProxy); >> public\cors-anywhere.js
echo app.use('/', apiProxy); // ルートパスへのリクエストもプロキシ >> public\cors-anywhere.js
echo. >> public\cors-anywhere.js
echo // サーバー起動 >> public\cors-anywhere.js
echo app.listen(CORS_PORT, () =^> { >> public\cors-anywhere.js
echo   console.log(`CORS Proxyがポート${CORS_PORT}で実行中...`); >> public\cors-anywhere.js
echo   console.log(`バックエンドの接続先: http://localhost:${BACKEND_PORT}`); >> public\cors-anywhere.js
echo   console.log('すべてのオリジンからのCORSリクエストを許可します'); >> public\cors-anywhere.js
echo }); >> public\cors-anywhere.js
echo. >> public\cors-anywhere.js
echo // 正常終了時の処理 >> public\cors-anywhere.js
echo process.on('SIGINT', () =^> { >> public\cors-anywhere.js
echo   console.log('CORSプロキシを終了しています...'); >> public\cors-anywhere.js
echo   process.exit(0); >> public\cors-anywhere.js
echo }); >> public\cors-anywhere.js

cd ..

:: 6. バックエンドを起動
echo [5/9] バックエンドサービスを起動しています...
start "Second-Me Backend" cmd /k "title Second-Me Backend && color 1f && echo バックエンドがポート %BACKEND_PORT% で起動中... && echo. && %VENV_NAME%\Scripts\activate.bat && python app.py"

:: バックエンドの初期化を待機
echo [6/9] バックエンドの初期化を待機しています...
timeout /t 8 /nobreak > nul

:: 7. CORSプロキシを起動
echo [7/9] CORSプロキシを起動しています...
cd lpm_frontend
start "Second-Me CORS Proxy" cmd /k "title Second-Me CORS Proxy && color 5f && echo CORSプロキシがポート %CORS_PORT% で起動中... && echo. && node public/cors-anywhere.js"

:: CORSプロキシの初期化を待機
echo CORSプロキシの初期化を待機しています...
timeout /t 5 /nobreak > nul

:: 8. フロントエンドを起動
echo [8/9] フロントエンドサービスを起動しています...
start "Second-Me Frontend" cmd /k "title Second-Me Frontend && color 2f && echo フロントエンドがポート %FRONTEND_PORT% で起動中... && echo. && npm run dev"
cd ..

:: ブラウザを自動で開く
echo [9/9] ブラウザを起動しています...
timeout /t 8 /nobreak > nul
start http://localhost:%FRONTEND_PORT%

echo.
echo  ================================================
echo    すべてのサービスが修正されました！
echo  ================================================
echo.
echo  バックエンド: http://localhost:%BACKEND_PORT%
echo  CORSプロキシ: http://localhost:%CORS_PORT%
echo  フロントエンド: http://localhost:%FRONTEND_PORT%
echo.
echo  それでも問題が解決しない場合：
echo  1. すべてのサービスを停止: taskkill /f /fi "WINDOWTITLE eq Second-Me*"
echo  2. フロントエンド依存関係を完全にクリーンアップ: lpm_frontend\clean-all.bat
echo  3. フロントエンドディレクトリに移動: cd lpm_frontend
echo  4. 依存関係を手動でインストール: npm install
echo  5. クリーンアップ後に再度このスクリプトを実行: cd .. && ultimate-fix.bat
echo.
echo  すべてのサービスを停止するには、コマンドウィンドウを閉じるか、次のコマンドを実行：
echo  taskkill /f /fi "WINDOWTITLE eq Second-Me*"
echo.
