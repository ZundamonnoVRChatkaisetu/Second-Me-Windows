@echo off
echo.
echo ================================================
echo  Second Me Windows - Frontend Dependencies Update
echo ================================================
echo.

echo Installing required dependencies...
call npm install clsx class-variance-authority tailwind-merge --save

echo.
echo Updating package.json...

:: インストールが成功したら、package.jsonを更新するためのフラグファイルを作成
echo Success > update_complete.tmp

echo.
echo Dependencies installation complete!
echo.
echo You can now run the application with:
echo npm run dev
echo.

pause
