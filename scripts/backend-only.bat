@echo off
echo.
echo  ================================================
echo    Second-Me Windows Backend Only Starter
echo  ================================================
echo.

:: 直接バックエンドを起動
call scripts\start.bat --backend-only

echo.
echo バックエンドが起動したら、別のコンソールで以下を実行してフロントエンドを起動できます:
echo cd lpm_frontend
echo npm install
echo npm run dev
echo.
