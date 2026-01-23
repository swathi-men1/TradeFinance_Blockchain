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

## 📚 API Documentation
While backend is running:
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🧪 Test Credentials
Print on backend console at startup:
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
- Build log: `build_log.md` in project root

## ✅ Phase 1 Checklist
- [x] Backend database auto-initializes
- [x] Dummy users auto-created
- [x] Frontend runs with Tailwind CSS
- [x] Both communicate via HTTP proxy
- [x] All code committed to git

## 🔜 Next: Phase 2
JWT authentication, login form, token generation
