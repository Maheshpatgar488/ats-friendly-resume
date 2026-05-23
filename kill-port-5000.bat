@echo off
title Port 5000 Self-Healing Utility
echo ====================================================================
echo   PORT 5000 SELF-HEALING UTILITY (BY ANTIGRAVITY AI)
echo ====================================================================
echo.
echo Searching for processes locking port 5000...

:: Find PID locking port 5000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    set PID=%%a
)

if "%PID%"=="" (
    echo.
    echo [INFO] Port 5000 is already free! No locked processes found.
    goto end
)

echo Found locked process on port 5000 with PID: %PID%
echo Force-terminating process...
taskkill /F /PID %PID%
echo.
echo [SUCCESS] Port 5000 has been successfully freed!

:end
echo.
echo You can now close this window and double-click "start-app.bat"!
echo ====================================================================
echo.
pause
