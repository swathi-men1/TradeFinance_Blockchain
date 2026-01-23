# Quick Start Guide

## 🚀 Start Backend
```bash
cd backend
python app.py
```
Runs on: **http://localhost:8000**

## 🚀 Start Frontend  
```bash
cd frontend
npm install  # First time only
npm run dev
```
Runs on: **http://localhost:5173**

## � Login to Application

1. Open http://localhost:5173
2. Use test credentials:
   - Username: `corporate_user`
   - Password: `corporate123`
3. See role-specific dashboard

## 📚 API Documentation
While backend is running:
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🧪 All Test Credentials
```
admin_user / admin123
bank_user / bank123
corporate_user / corporate123
auditor_user / auditor123
```

## 📊 Check Database
```bash
# Connect to PostgreSQL
psql -U postgres -d tradefin_chaindb

# List tables
\dt

# Query users
SELECT * FROM users;
```

## 📝 Logs Location
- Backend logs: Console output (when running `python app.py`)
- Frontend logs: Browser console (F12)
- Build log: `build_log.md` in project root

## ✅ Phase 2 Complete
- [x] JWT authentication working
- [x] Login/Signup endpoints
- [x] Corporate login UI
- [x] Dashboard role-aware rendering
- [x] Console logs for debugging

## 🔜 Next: Phase 3
Sidebar navigation, protected routes, user settings
