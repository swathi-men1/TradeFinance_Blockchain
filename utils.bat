@echo off
REM ============================================================
REM Trade Finance Blockchain - Utility Scripts
REM ============================================================

setlocal enabledelayedexpansion
color 0A

:menu
cls
echo.
echo ============================================================
echo   TRADE FINANCE BLOCKCHAIN - UTILITY MENU
echo ============================================================
echo.
echo [1] Reset Database (DELETE all data and reseed)
echo [2] Run Database Migrations (alembic upgrade head)
echo [3] Seed Database with Test Users
echo [4] Test Database Connection
echo [5] Start Backend Only
echo [6] Start Frontend Only
echo [7] Install/Update dependencies
echo [8] View Test Accounts
echo [9] Exit
echo.
echo ============================================================
echo.

set /p choice="Select an option (1-9): "

if "%choice%"=="1" goto reset_db
if "%choice%"=="2" goto migrations
if "%choice%"=="3" goto seed
if "%choice%"=="4" goto test_connection
if "%choice%"=="5" goto backend_only
if "%choice%"=="6" goto frontend_only
if "%choice%"=="7" goto install_deps
if "%choice%"=="8" goto test_accounts
if "%choice%"=="9" goto exit_script

echo Invalid choice. Please select 1-9.
timeout /t 2 >nul
goto menu

REM ============================================================
REM Option 1: Reset Database
REM ============================================================
:reset_db
echo.
echo [WARNING] This will DELETE ALL data from the database
set /p confirm="Are you sure? (yes/no): "
if /i not "%confirm%"=="yes" (
    echo Operation cancelled.
    timeout /t 2 >nul
    goto menu
)

cd backend
call venv\Scripts\activate.bat

echo Dropping and recreating database schema...
python <<EOF
import sqlalchemy as sa
from app.db.base import Base
from app.db.session import engine

# Drop all tables
Base.metadata.drop_all(engine)
print("[OK] All tables dropped")

# Recreate tables from migrations
EOF

echo Running alembic upgrade...
alembic upgrade head
if errorLevel 1 (
    echo [ERROR] Migration failed
    pause
    goto menu
)

echo Seeding test data...
python seed_database.py
if errorLevel 1 (
    echo [WARNING] Seeding had issues, but database was reset
)

echo [OK] Database reset and seeded successfully
pause
goto menu

REM ============================================================
REM Option 2: Run Migrations
REM ============================================================
:migrations
echo.
echo Running database migrations...
cd backend
call venv\Scripts\activate.bat
alembic upgrade head
if errorLevel 1 (
    echo [ERROR] Migration failed
    pause
    goto menu
)
echo [OK] Migrations completed
pause
goto menu

REM ============================================================
REM Option 3: Seed Database
REM ============================================================
:seed
echo.
echo Seeding database with test users...
cd backend
call venv\Scripts\activate.bat
python seed_database.py
if errorLevel 1 (
    echo [ERROR] Seeding failed
    pause
    goto menu
)
echo [OK] Database seeded successfully
pause
goto menu

REM ============================================================
REM Option 4: Test Connection
REM ============================================================
:test_connection
echo.
echo Testing database connection...
cd backend
call venv\Scripts\activate.bat
python test_db_connection.py
if errorLevel 1 (
    echo [ERROR] Connection test failed
    echo Please check:
    echo   1. PostgreSQL is running
    echo   2. Database exists: trade_finance
    echo   3. .env file has correct DATABASE_URL
    pause
    goto menu
)
echo [OK] Database connection successful
pause
goto menu

REM ============================================================
REM Option 5: Start Backend Only
REM ============================================================
:backend_only
echo.
echo Starting backend server only...
cd backend
call venv\Scripts\activate.bat
echo Backend will run at: http://localhost:8000
echo API docs at: http://localhost:8000/docs
echo Press Ctrl+C to stop
timeout /t 2 >nul
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
goto menu

REM ============================================================
REM Option 6: Start Frontend Only
REM ============================================================
:frontend_only
echo.
echo Starting frontend server only...
cd frontend
echo Frontend will run at: http://localhost:5173
echo Press Ctrl+C to stop
timeout /t 2 >nul
call npm run dev
goto menu

REM ============================================================
REM Option 7: Install Dependencies
REM ============================================================
:install_deps
echo.
set /p target="Install [backend/frontend/both]: "

if /i "%target%"=="backend" (
    echo Installing backend dependencies...
    cd backend
    call venv\Scripts\activate.bat
    python -m pip install --upgrade pip
    pip install -r requirements.txt
    goto menu
)

if /i "%target%"=="frontend" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    goto menu
)

if /i "%target%"=="both" (
    echo Installing backend dependencies...
    cd backend
    call venv\Scripts\activate.bat
    python -m pip install --upgrade pip
    pip install -r requirements.txt
    
    echo.
    echo Installing frontend dependencies...
    cd ..\frontend
    call npm install
    goto menu
)

echo Invalid choice.
timeout /t 2 >nul
goto menu

REM ============================================================
REM Option 8: View Test Accounts
REM ============================================================
:test_accounts
if exist "TEST_ACCOUNTS.md" (
    type TEST_ACCOUNTS.md
) else (
    echo [ERROR] TEST_ACCOUNTS.md not found
    echo Default test credentials:
    echo.
    echo Admin:       admin@tradefinance.com / admin123!@#
    echo Bank:        bank@tradefinance.com / bank123!@#
    echo Corporate:   corporate@tradefinance.com / corporate123!@#
    echo Auditor:     auditor@tradefinance.com / auditor123!@#
)
pause
goto menu

REM ============================================================
REM Exit
REM ============================================================
:exit_script
echo.
echo Goodbye!
timeout /t 1 >nul
exit /b 0

endlocal
