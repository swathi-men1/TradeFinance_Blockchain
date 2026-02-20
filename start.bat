@echo off
REM ============================================================
REM Trade Finance Blockchain - Quick Start (Minimal Setup)
REM ============================================================
REM This script starts the application assuming prerequisites are met

setlocal enabledelayedexpansion
color 0A

echo.
echo ============================================================
echo   TRADE FINANCE BLOCKCHAIN - QUICK START
echo ============================================================
echo.

REM Check if backend venv exists
if not exist "backend\venv" (
    echo [ERROR] Virtual environment not found
    echo Please run run-app.bat first for full setup
    pause
    exit /b 1
)

REM Activate backend venv and start services
echo Starting Backend Server...
start "TradeFinance Backend" cmd /k "cd backend && venv\Scripts\activate.bat && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 >nul

echo Starting Frontend Server...
start "TradeFinance Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================================
echo SERVERS STARTING...
echo ============================================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to close this window
pause >nul

endlocal
