# Trade Finance Blockchain - Batch Scripts Guide

This guide explains the batch scripts provided for easy application management on Windows.

---

## 📋 Available Scripts

### 1. **run-app.bat** (Full Setup & Start)
**Use this for the first time or complete reset**

```bash
run-app.bat
```

**What it does:**
- ✅ Checks Python, Node.js, and npm are installed
- ✅ Creates Python virtual environment
- ✅ Installs backend dependencies
- ✅ Installs frontend dependencies
- ✅ Tests database connection
- ✅ Runs database migrations (alembic)
- ✅ Seeds test users into database
- ✅ Starts backend server (port 8000)
- ✅ Starts frontend server (port 5173)

**Best for:** Fresh installation, full setup, or troubleshooting

**Time:** 2-5 minutes (depending on internet)

---

### 2. **start.bat** (Quick Start)
**Use this for daily development work**

```bash
start.bat
```

**What it does:**
- ✅ Quickly starts both servers
- Assumes setup is already complete

**Best for:** Starting work after initial setup

**Time:** 10-15 seconds

**Requirements:** Must have run `run-app.bat` at least once

---

### 3. **utils.bat** (Utility Menu)
**Use for database management and specific tasks**

```bash
utils.bat
```

**Menu options:**

| Option | Function | When to use |
|--------|----------|-----------|
| 1 | Reset Database | After major changes, to start fresh |
| 2 | Run Migrations | Update database schema |
| 3 | Seed Database | Repopulate test users |
| 4 | Test Connection | Check database connectivity |
| 5 | Backend Only | Start just the API server |
| 6 | Frontend Only | Start just the web app |
| 7 | Install Dependencies | Update npm/pip packages |
| 8 | View Test Accounts | See login credentials |
| 9 | Exit | Close menu |

---

## 🚀 Getting Started

### First Time Setup

1. **Double-click `run-app.bat`**
   - This will handle everything for you
   - Follow any on-screen prompts
   - Wait for both servers to start

2. **Open your browser**
   - Frontend: http://localhost:5173
   - API Docs: http://localhost:8000/docs

3. **Login with test credentials**
   - Email: `admin@tradefinance.com`
   - Password: `admin123!@#`

---

## ⚠️ Prerequisites

Before running any script, ensure you have:

### Required Software
- **Python 3.9+** - Download from [python.org](https://www.python.org/downloads/)
- **Node.js 16+** - Download from [nodejs.org](https://nodejs.org/)
- **PostgreSQL 12+** - Download from [postgresql.org](https://www.postgresql.org/download/)

### Verify Installation
```bash
python --version      # Should show Python 3.9 or higher
node --version        # Should show Node.js 16 or higher
npm --version         # Should show npm version
```

### Database Setup
1. **Start PostgreSQL service**
   - Windows: Check Services app → PostgreSQL
   - Or: Use PostgreSQL dashboard

2. **Create database**
   - Open pgAdmin or command line
   - Create database named `trade_finance`
   - Or the script will prompt you

---

## 🔧 Configuration

### .env File
The script creates a default `.env` file in the `backend/` folder:

```ini
DATABASE_URL=postgresql://postgres:password@localhost/trade_finance
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Customize if needed:**
- Change `postgres` password if different
- Change server address if database is remote
- Keep `SECRET_KEY` secure in production

---

## 🐛 Troubleshooting

### "Python is not installed"
↳ **Solution:** Download Python from [python.org](https://www.python.org/downloads/) and add to PATH

### "Database does not exist" 
↳ **Solution:** 
1. Run `utils.bat` → Option 4 (Test Connection)
2. Create `trade_finance` database in PostgreSQL
3. Check `.env` DATABASE_URL is correct

### "Port 8000 already in use"
↳ **Solution:**
- Close other applications using port 8000
- Or modify port in the batch file (edit the final command)

### "Port 5173 already in use"
↳ **Solution:** Vite will auto-increment the port - check console output for actual URL

### "pip install fails"
↳ **Solution:** 
1. Ensure virtual environment is activated
2. Run `python -m pip install --upgrade pip`
3. Try again

### "npm install fails"  
↳ **Solution:**
1. Run `npm cache clean --force`
2. Delete `node_modules/` folder
3. Run `npm install` again

### "Cannot connect to backend from frontend"
↳ **Solution:**
1. Ensure backend is running on port 8000
2. Check frontend service configuration in `frontend/src/services/`
3. Try accessing http://localhost:8000 directly in browser

---

## 📊 Default Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tradefinance.com | admin123!@# |
| Bank | bank@tradefinance.com | bank123!@# |
| Corporate | corporate@tradefinance.com | corporate123!@# |
| Auditor | auditor@tradefinance.com | auditor123!@# |

See `TEST_ACCOUNTS.md` for more details and additional users.

---

## 💡 Common Workflows

### Development Workflow
```
1. Double-click start.bat
2. Make code changes
3. Changes auto-reload in both frontend and backend
4. Browser auto-refreshes
5. Test in http://localhost:5173
```

### Database Reset Workflow
```
1. Run utils.bat
2. Select Option 1 (Reset Database)
3. Confirm deletion
4. Wait for completion
5. Login with fresh test data
```

### Dependency Update Workflow
```
1. Run utils.bat
2. Select Option 7 (Install Dependencies)
3. Choose backend/frontend/both
4. Wait for completion
5. Restart with start.bat
```

---

## 📂 File Locations

```
TradeFinance_Blockchain/
├── run-app.bat          ← Full setup + start
├── start.bat            ← Quick start (daily use)  
├── utils.bat            ← Utility menu
├── backend/
│   ├── venv/            ← Virtual environment (created by run-app.bat)
│   ├── .env            ← Database config (created by run-app.bat)
│   ├── alembic/        ← Database migrations
│   └── app/            ← FastAPI application
├── frontend/
│   ├── src/            ← React source code
│   ├── node_modules/   ← npm packages (created by run-app.bat)
│   └── package.json    ← Dependencies list
└── docs/
    ├── ARCHITECTURE.md ← System design
    ├── API_REFERENCE.md ← API documentation
    └── DEPLOYMENT.md   ← Production setup
```

---

## 🔐 Security Notes

### Development
- Using default test users is fine for development
- `SECRET_KEY` in `.env` is for demonstration only

### Before Production
- Change `SECRET_KEY` to a strong random string
- Use strong database password
- Enable HTTPS
- Restrict database access
- Set `ACCESS_TOKEN_EXPIRE_MINUTES` appropriately
- Use environment-specific `.env` files

---

## 📝 Advanced Usage

### Running Only Backend
```bash
utils.bat → Option 5
```

### Running Only Frontend
```bash
utils.bat → Option 6
```

### Running Backend on Different Port
Edit the batch file and change `--port 8000` to your desired port

### Running Migrations Manually
```bash
cd backend
venv\Scripts\activate
alembic upgrade head
```

### Creating New Database Migration
```bash
cd backend
venv\Scripts\activate
alembic revision --autogenerate -m "your description"
alembic upgrade head
```

---

## 📞 Support

If you encounter issues:

1. **Check the README.md** for comprehensive documentation
2. **Run utils.bat** and test the database connection
3. **Check prerequisites** are properly installed
4. **See Troubleshooting section** above
5. **Review logs** in the server terminal windows

---

## 🎯 Next Steps

1. ✅ Run `run-app.bat` for initial setup
2. ✅ Visit http://localhost:5173 once servers start
3. ✅ Login with admin@tradefinance.com / admin123!@#
4. ✅ Explore the application
5. ✅ Use `start.bat` for future sessions
6. ✅ Use `utils.bat` for maintenance tasks

---

**Happy coding! 🚀**
