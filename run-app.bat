@echo off
REM ============================================================
REM Trade Finance Blockchain - Application Startup Script
REM ============================================================
REM This script manages the complete application setup and startup
REM including backend, frontend, and database configuration

setlocal enabledelayedexpansion
color 0A

REM Define colors for output
for /F %%A in ('copy /Z "%~f0" nul') do set "BS=%%A"

echo.
echo ============================================================
echo   TRADE FINANCE BLOCKCHAIN - APPLICATION LAUNCHER
echo ============================================================
echo.

REM Check if running as Administrator for database operations
REM net session >nul 2>&1
REM if %errorLevel% neq 0 (
REM     echo WARNING: Consider running as Administrator for database setup
REM     echo.
REM )

REM ============================================================
REM 1. CHECK PREREQUISITES
REM ============================================================
echo [STEP 1] Checking Prerequisites...
echo.

REM Check Python
python --version >nul 2>&1
if errorLevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please download Python from https://www.python.org/downloads/
    pause
    exit /b 1
)
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo [OK] Python %PYTHON_VERSION% found

REM Check Node.js
node --version >nul 2>&1
if errorLevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please download Node.js from https://nodejs.org/
    pause
    exit /b 1
)
for /f %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION% found

REM Check npm
npm --version >nul 2>&1
if errorLevel 1 (
    echo [ERROR] npm is not installed or not in PATH
    pause
    exit /b 1
)
for /f %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm %NPM_VERSION% found

echo.
echo [STEP 2] Setting Up Backend...
echo.

REM Navigate to backend directory
cd backend
if errorLevel 1 (
    echo [ERROR] Could not navigate to backend directory
    pause
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    if errorLevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
    echo [OK] Virtual environment created
) else (
    echo [OK] Virtual environment already exists
)

REM Activate virtual environment
call venv\Scripts\activate.bat
if errorLevel 1 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)
echo [OK] Virtual environment activated

REM Install/upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip >nul 2>&1
if errorLevel 1 (
    echo [WARNING] Failed to upgrade pip, continuing anyway...
)

REM Install backend dependencies
echo Installing backend dependencies...
pip install -r requirements.txt >nul 2>&1
if errorLevel 1 (
    echo [ERROR] Failed to install backend dependencies
    echo Please check requirements.txt and try manually:
    echo   cd backend
    echo   python -m pip install -r requirements.txt
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed

REM Check if .env file exists
if not exist ".env" (
    echo.
    echo [WARNING] .env file not found in backend directory
    echo Creating default .env file...
    (
        echo DATABASE_URL=postgresql://postgres:password@localhost/trade_finance
        echo SECRET_KEY=your-secret-key-change-this-in-production
        echo ALGORITHM=HS256
        echo ACCESS_TOKEN_EXPIRE_MINUTES=30
    ) > .env
    echo [OK] Default .env file created
    echo [NOTE] Please update .env with your actual database credentials
) else (
    echo [OK] .env file found
)

REM Test database connection
echo Testing database connection...
python test_db_connection.py >nul 2>&1
if errorLevel 1 (
    echo [WARNING] Database connection test failed
    echo Please ensure PostgreSQL is running and .env is configured correctly
    echo Expected: DATABASE_URL=postgresql://postgres:password@localhost/trade_finance
    echo.
) else (
    echo [OK] Database connection successful
    
    REM Run database migrations
    echo Running database migrations...
    alembic upgrade head >nul 2>&1
    if errorLevel 1 (
        echo [WARNING] Alembic migration failed
        echo Try running manually: alembic upgrade head
    ) else (
        echo [OK] Database migrations completed
        
        REM Seed database with test data
        echo Seeding database with test users...
        python seed_database.py >nul 2>&1
        if errorLevel 1 (
            echo [WARNING] Database seeding failed
            echo You can seed manually later: python seed_database.py
        ) else (
            echo [OK] Test users seeded
        )
    )
)

echo.
echo [STEP 3] Setting Up Frontend...
echo.

REM Navigate to frontend directory
cd ..\frontend
if errorLevel 1 (
    echo [ERROR] Could not navigate to frontend directory
    pause
    exit /b 1
)

REM Install frontend dependencies
echo Installing frontend dependencies...
call npm install >nul 2>&1
if errorLevel 1 (
    echo [ERROR] Failed to install frontend dependencies
    echo Try manually: cd frontend && npm install
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed

echo.
echo ============================================================
echo [STEP 4] Starting Application Services...
echo ============================================================
echo.
echo Backend will start on:  http://localhost:8000
echo Frontend will start on: http://localhost:5173
echo API Docs will be at:    http://localhost:8000/docs
echo.
echo Press any key to continue...
pause >nul

REM Return to backend directory
cd ..\backend

REM Activate venv again for backend startup
call venv\Scripts\activate.bat

REM Start backend in a new window
echo Starting Backend Server...
start "TradeFinance Backend" cmd /k "python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
if errorLevel 1 (
    echo [ERROR] Failed to start backend
    pause
    exit /b 1
)
echo [OK] Backend server started in new window

REM Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

REM Navigate to frontend and start it in a new window
cd ..\frontend
echo Starting Frontend Server...
start "TradeFinance Frontend" cmd /k "npm run dev"
if errorLevel 1 (
    echo [ERROR] Failed to start frontend
    pause
    exit /b 1
)
echo [OK] Frontend server started in new window

REM Final status
echo.
echo ============================================================
echo APPLICATION STARTUP COMPLETE
echo ============================================================
echo.
echo [INFO] Both servers are starting in separate windows...
echo.
echo Backend:
echo   URL: http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
echo Frontend:
echo   URL: http://localhost:5173
echo.
echo Default Test Credentials:
echo   Email: admin@tradefinance.com
echo   Password: admin123!@#
echo.
echo Other test users (see TEST_ACCOUNTS.md for details)
echo.
echo To stop the application, close both terminal windows or press Ctrl+C in each.
echo.
echo ============================================================
echo.
pause

endlocal
