# ChainDocs Project Build Log

## PHASE 1: Project Skeleton & Database Foundation
**Date**: January 24, 2026

### ✅ What Was Built

#### Backend (FastAPI + PostgreSQL)
1. **Project Structure**
   - `backend/app/` - Main application code
   - `backend/app/core/` - Security utilities (password hashing)
   - `backend/app/models/` - SQLAlchemy ORM models
   - `backend/app/database/` - Database connection & initialization
   - `backend/app/routes/` - API endpoints (to be added in Phase 2)
   - `backend/app/schemas/` - Pydantic schemas (to be added in Phase 2)

2. **Database Features**
   - **Auto-connection**: `app.database.database.py` handles PostgreSQL connection
   - **Auto-creation**: Database created automatically if it doesn't exist
   - **Auto-initialization**: Tables created on startup from SQLAlchemy models
   - **Dummy data**: 4 test users with different roles

3. **Database Tables Created**
   - `users` - System users with roles (admin, bank, corporate, auditor)
   - `documents` - Uploaded trade documents with SHA-256 hashing
   - `ledger_entries` - Blockchain ledger entries
   - `trade_transactions` - Buy/sell transactions
   - `risk_scores` - Risk assessments

4. **Dummy Users** (printed on startup)
   ```
   admin_user / admin123 (ADMIN)
   bank_user / bank123 (BANK)
   corporate_user / corporate123 (CORPORATE)
   auditor_user / auditor123 (AUDITOR)
   ```

#### Frontend (React + Tailwind CSS)
1. **Tech Stack**
   - React 18 with Vite (fast dev server)
   - Tailwind CSS for corporate styling
   - PostCSS with autoprefixer

2. **Project Structure**
   - `frontend/src/` - React source code
   - `frontend/src/components/` - Reusable components
   - `frontend/src/pages/` - Page components
   - `frontend/src/api/` - API client utilities

3. **Styling**
   - Corporate theme colors (slate, blue)
   - Custom Tailwind utilities for consistent design

### 🚀 How to Run

#### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```
- Runs on `http://localhost:8000`
- Auto-creates PostgreSQL database
- Auto-creates tables
- Prints dummy user credentials
- Docs available at `http://localhost:8000/docs`

#### Frontend
```bash
cd frontend
npm install
npm run dev
```
- Runs on `http://localhost:5173`
- Tailwind CSS active
- API proxy configured to backend

### 📊 Database Initialization Flow

```
1. app.py runs
   ↓
2. FastAPI startup event triggered
   ↓
3. init_database() called
   ├─ Connect to PostgreSQL default database
   ├─ Create application database if missing
   ├─ Create engine for app database
   └─ Create all SQLAlchemy tables
   ↓
4. init_dummy_data() called
   └─ Insert 4 test users with roles
   ↓
5. Print database connection logs
6. Print dummy user credentials
7. Server ready for requests
```

### 🔑 Configuration Files

1. **Backend/.env**
   - DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME
   - ENVIRONMENT, DEBUG settings

2. **Frontend/.env**
   - VITE_API_URL = http://localhost:8000

3. **.gitignore**
   - Ignores: .env, __pycache__, node_modules, build artifacts
   - Ignores: .vscode, .idea, database files

### ⚙️ Technical Decisions & Why

| Decision | Why |
|----------|-----|
| **SQLAlchemy ORM** | Type-safe, auto-migration support, relationship handling |
| **Pydantic schemas** | Request/response validation, automatic OpenAPI docs |
| **Bcrypt hashing** | Industry standard, slow by design (security) |
| **JWT tokens** | Stateless auth, scales horizontally, Phase 2 uses this |
| **React + Vite** | Fast HMR, minimal config, modern tooling |
| **Tailwind CSS** | Utility-first, consistent design, easy corporate theme |
| **Auto-DB creation** | Zero-friction setup, great for development |

### 🔗 How Frontend & Backend Communicate

```
Frontend (React)
    ↓ HTTP Requests
    ├─ POST /api/auth/login
    ├─ GET /api/users
    └─ GET /api/documents
    ↓
Backend (FastAPI)
    ├─ Receives request
    ├─ Validates with Pydantic
    ├─ Queries SQLAlchemy models
    ├─ Returns JSON response
    ↓
Frontend
    ├─ Stores tokens in localStorage
    ├─ Renders data with React
    └─ Updates UI with Tailwind CSS
```

### 📝 What's Next (Phase 2)

- JWT authentication endpoints (login/signup)
- Token generation and refresh logic
- Corporate login UI
- Role-based access control
- Protected API routes

### ⚠️ Issues Faced & Solutions

None yet - clean startup! Just ensure PostgreSQL is running before starting backend.

### 📌 Running the Project

**Terminal 1 - Backend:**
```bash
cd backend
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install  # first time only
npm run dev
```

Then open `http://localhost:5173` in browser.
