@echo off
echo Reinstalling dependencies for Second-Me frontend...
echo.

echo Removing node_modules directory...
if exist node_modules rmdir /s /q node_modules

echo Removing package-lock.json...
if exist package-lock.json del /f package-lock.json

echo Clearing npm cache...
call npm cache clean --force

echo Installing dependencies...
call npm install

echo Dependencies reinstalled successfully.
echo Please run 'npm run dev' to start the development server.
