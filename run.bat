@echo off
REM Shinku 神紅 Text Editor - Quick Start Script
REM Starts the development server for Tauri app

echo.
echo ╔════════════════════════════════════════╗
echo ║   SHINKU 神紅 EDITOR - Starting App...  ║
echo ╚════════════════════════════════════════╝
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing npm dependencies...
    call npm install
    echo.
)

REM Start Tauri dev server
echo Starting Tauri development server...
call npm run tauri dev

pause
