@echo off
echo.
echo ===================================
echo  Second-Me フロントエンド完全クリーンアップ
echo ===================================
echo.

echo 1. node_modulesを削除しています...
if exist node_modules rmdir /s /q node_modules

echo 2. package-lock.jsonを削除しています...
if exist package-lock.json del package-lock.json

echo 3. .nextディレクトリを削除しています...
if exist .next rmdir /s /q .next

echo 4. キャッシュをクリアしています...
call npm cache clean --force

echo 5. CORSプロキシファイルを削除しています...
if exist public\cors-anywhere.js del public\cors-anywhere.js

echo.
echo ===================================
echo  クリーンアップ完了
echo ===================================
echo.
echo 次のステップ:
echo 1. 本ディレクトリで「npm install」を実行してください
echo 2. 親ディレクトリの「ultimate-fix.bat」を実行してください
echo.
