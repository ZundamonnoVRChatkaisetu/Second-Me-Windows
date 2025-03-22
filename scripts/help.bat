@echo off
setlocal enabledelayedexpansion

:: Color definitions (Windows)
set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set BLUE=[94m
set MAGENTA=[95m
set CYAN=[96m
set GRAY=[90m
set BOLD=[1m
set NC=[0m

:: Display header
echo.
echo %CYAN%
echo  ███████╗███████╗ ██████╗ ██████╗ ███╗   ██╗██████╗       ███╗   ███╗███████╗
echo  ██╔════╝██╔════╝██╔════╝██╔═══██╗████╗  ██║██╔══██╗      ████╗ ████║██╔════╝
echo  ███████╗█████╗  ██║     ██║   ██║██╔██╗ ██║██║  ██║█████╗██╔████╔██║█████╗  
echo  ╚════██║██╔══╝  ██║     ██║   ██║██║╚██╗██║██║  ██║╚════╝██║╚██╔╝██║██╔══╝  
echo  ███████║███████╗╚██████╗╚██████╔╝██║ ╚████║██████╔╝      ██║ ╚═╝ ██║███████╗
echo  ╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚═════╝       ╚═╝     ╚═╝╚══════╝
echo %NC%
echo %BOLD%Second-Me Windows Help%NC%
echo %GRAY%%date% %time%%NC%
echo.

echo %BOLD%Windows用Second-Meヘルプ%NC%
echo.
echo %GREEN%▶ メインコマンド:%NC%
echo   scripts\setup.bat            - 完全インストール
echo   scripts\start.bat            - すべてのサービスを開始
echo   scripts\stop.bat             - すべてのサービスを停止
echo   scripts\restart.bat          - すべてのサービスを再起動
echo   scripts\status.bat           - すべてのサービスのステータスを表示
echo.
echo %GREEN%▶ アドバンストコマンド:%NC%
echo   scripts\start.bat --backend-only - バックエンドサービスのみ開始
echo.
echo %GREEN%▶ トラブルシューティング:%NC%
echo   1. セットアップ失敗の場合:
echo      - Visual Studio C++ビルドツールがインストールされていることを確認
echo      - CMakeが最新バージョンであることを確認
echo      - Pythonが3.10以上であることを確認
echo.
echo   2. サービス起動失敗の場合:
echo      - ログファイル（logs\backend.log、logs\frontend.log）を確認
echo      - ポート（%LOCAL_APP_PORT%、%LOCAL_FRONTEND_PORT%）が別プロセスで使用されていないか確認
echo      - scripts\stop.batを実行してから再試行
echo.
echo   3. 一般的な問題:
echo      - コマンドプロンプトを管理者権限で実行していることを確認
echo      - Condaが正しく設定されていることを確認（conda --version）
echo      - Node.jsが正しくインストールされていることを確認（node --version）
echo.
echo %GREEN%▶ フォルダ構造:%NC%
echo   logs\                    - ログファイル
echo   run\                     - 実行時一時ファイル 
echo   scripts\                 - スクリプトファイル
echo   lpm_frontend\            - フロントエンドコード
echo   llama.cpp\               - 推論エンジン
echo.
echo %YELLOW%詳細なドキュメントはREADME.mdを参照してください。%NC%

exit /b 0
