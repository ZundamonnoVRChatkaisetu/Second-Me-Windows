@echo off
echo.
echo  ================================================
echo    Second-Me Windows - Health Check Skip Starter
echo  ================================================
echo.

echo Starting services with health check skipped.
echo Backend startup might take a few minutes.
echo.

call scripts\start.bat --skip-health-check

echo.
