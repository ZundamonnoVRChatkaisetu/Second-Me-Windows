@echo off
echo.
echo  ================================================
echo    Second-Me Windows - Health Check Skip Starter
echo  ================================================
echo.

echo ヘルスチェックをスキップしてサービスを起動します。
echo バックエンドが正常に起動するまで数分かかる場合があります。
echo.

call scripts\start.bat --skip-health-check

echo.
