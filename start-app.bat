@echo off
title ATS Resume Builder Launcher
echo ====================================================================
echo   ATS RESUME BUILDER SYSTEM LAUNCHER (BY ANTIGRAVITY AI)
echo ====================================================================
echo.
echo [1/3] Launching backend server...
start "Express Backend Server" cmd /k "cd /d "%~dp0backend" && npm run dev"

echo [2/3] Launching frontend client...
start "Vite Frontend Client" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo [3/3] Waiting 6 seconds for bootup...
timeout /t 6 /nobreak

echo.
echo Opening default web browser...
explorer "http://localhost:5173"

echo.
echo Launch sequence complete! This window will now close.
timeout /t 2 /nobreak >nul
exit
