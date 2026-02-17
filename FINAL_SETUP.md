# Trade Finance Blockchain System - Complete Setup Guide

## ✅ What You Now Have

### Two Fully Integrated Applications

**Frontend (NEW - TypeScript)**
- Location: `/frontend`
- Port: `http://localhost:8080`
- Tech: React + TypeScript + Vite + shadcn/ui
- Status: ✅ Running and connected to backend

**Backend (Python)**
- Location: `/backend`
- Port: `http://localhost:8000`
- Tech: FastAPI + SQLAlchemy + PostgreSQL
- Status: ✅ Running with real API endpoints

---

## 🗂️ Complete Directory Structure

```
TradeFinance_Blockchain/
│
├── backend/                          # Python FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI application
│   │   ├── database.py             # PostgreSQL connection
│   │   │
│   │   ├── models/                 # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── organization.py
│   │   │   ├── trade_transaction.py
│   │   │   ├── document.py
│   │   │   ├── ledger.py
│   │   │   ├── risk_score.py
│   │   │   └── __init__.py
│   │   │
│   │   ├── routes/                 # API endpoints
│   │   │   ├── auth.py             # Login, signup
│   │   │   ├── trades.py           # Trade CRUD, approve/reject
│   │   │   ├── documents.py        # Upload, view, verify
│   │   │   ├── ledger.py           # Blockchain ledger
│   │   │   ├── integrity.py        # Document integrity check
│   │   │   ├── risk.py             # Risk scoring
│   │   │   ├── analytics.py        # Analytics endpoints
│   │   │   ├── organization.py     # Org management
│   │   │   ├── export.py           # Data export (CSV)
│   │   │   └── __init__.py
│   │   │
│   │   ├── schemas/                # Pydantic input schemas
│   │   │   ├── user.py
│   │   │   ├── organization.py
│   │   │   └── __init__.py
│   │   │
│   │   ├── utils/                  # Utility functions
│   │   │   ├── auth.py             # JWT token management
│   │   │   ├── security.py         # Password hashing
│   │   │   ├── rbac.py             # Role-based access control
│   │   │   ├── hash_utils.py       # SHA256 hashing
│   │   │   ├── integrity_check.py  # Document verification
│   │   │   ├── ledger_utils.py     # Ledger utilities
│   │   │   ├── risk_engine.py      # Risk calculation
│   │   │   └── __init__.py
│   │   │
│   │   ├── services/               # Business logic
│   │   │   ├── document_service.py
│   │   │   ├── integrity_service.py
│   │   │   ├── ledger_service.py
│   │   │   ├── risk_service.py
│   │   │   └── __init__.py
│   │   │
│   │   ├── core/                   # Core services
│   │   │   ├── minio_client.py     # S3-compatible storage
│   │   │   └── __init__.py
│   │   │
│   │   ├── dependencies/           # FastAPI dependencies
│   │   │   ├── auth.py
│   │   │   └── __init__.py
│   │   │
│   │   └── __pycache__/
│   │
│   ├── requirements.txt             # Python dependencies
│   ├── seed_data.py                # Test data generator
│   └── venv/                       # Virtual environment
│
├── frontend/                         # TypeScript React Frontend (NEW)
│   ├── src/
│   │   ├── pages/                  # Page components
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── TradesPage.tsx      # Trade management
│   │   │   ├── DocumentsPage.tsx   # Document upload/view
│   │   │   ├── RiskPage.tsx        # Risk analysis
│   │   │   ├── LedgerPage.tsx      # Blockchain ledger
│   │   │   ├── UsersPage.tsx       # Admin user management
│   │   │   └── Index.tsx
│   │   │
│   │   ├── components/             # Reusable components
│   │   │   ├── DashboardLayout.tsx # Layout wrapper
│   │   │   ├── AppSidebar.tsx      # Navigation sidebar
│   │   │   ├── NavLink.tsx         # Navigation link
│   │   │   ├── StatCard.tsx        # Statistics card
│   │   │   ├── TradeStatusBadge.tsx # Status indicator
│   │   │   ├── RiskMeter.tsx       # Risk visualization
│   │   │   ├── ui/                 # shadcn/ui components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── toast.tsx
│   │   │   │   └── ... (more UI components)
│   │   │   └── __init__.ts
│   │   │
│   │   ├── contexts/               # React context
│   │   │   └── AuthContext.tsx     # Authentication state
│   │   │
│   │   ├── services/               # API calls
│   │   │   └── api.ts              # Fetch-based API client
│   │   │
│   │   ├── types/                  # TypeScript types
│   │   │   ├── index.ts            # Type definitions
│   │   │   └── ...
│   │   │
│   │   ├── hooks/                  # Custom React hooks
│   │   │   └── ...
│   │   │
│   │   ├── lib/                    # Utility functions
│   │   │   └── utils.ts
│   │   │
│   │   ├── data/                   # Mock data
│   │   │   └── ...
│   │   │
│   │   ├── App.tsx                 # Main component
│   │   ├── App.css
│   │   ├── main.tsx                # Entry point
│   │   ├── index.css               # Global styles
│   │   └── vite-env.d.ts           # Vite type definitions
│   │
│   ├── public/                      # Static assets
│   ├── vite.config.ts              # Vite configuration
│   ├── tsconfig.json               # TypeScript config
│   ├── package.json                # Node dependencies
│   ├── package-lock.json
│   ├── .env                        # Environment variables (VITE_API_URL)
│   ├── .env.example
│   ├── index.html                  # HTML template
│   ├── postcss.config.js           # PostCSS config
│   ├── tailwind.config.ts          # Tailwind CSS config
│   ├── eslint.config.js            # ESLint config
│   └── README.md
│
├── trade-frontend/                 # Old frontend (can be removed)
│   └── ... (legacy React + Tailwind)
│
├── venv/                           # Python virtual environment
│
├── QUICK_START.md                  # Quick start guide
├── INTEGRATION_GUIDE.md            # System architecture
├── DEPLOYMENT_GUIDE.md             # Production deployment
├── README.md                       # Project overview
├── LICENSE                         # MIT License
└── .git/                          # Git repository

```

---

## 🚀 How to Run Everything

### Step 1: Start Backend
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
**Output**: Backend running at `http://localhost:8000`

### Step 2: Start Frontend (New)
```bash
cd frontend
npm run dev
```
**Output**: Frontend running at `http://localhost:8080`

### Step 3: Access Application
Open browser: `http://localhost:8080`

---

## 🔐 Test Accounts

```
🏦 BANK USER
  Email: bank@globalbank.com
  Password: password123
  Can: Create trades, approve/reject, view all data

🏢 CORPORATE USER
  Email: corporate@techent.com
  Password: password123
  Can: Upload documents, view own trades

🕵️ AUDITOR USER
  Email: auditor@auditorpro.com
  Password: password123
  Can: View all data, export reports

👨‍💼 ADMIN USER
  Email: admin@sysadmin.com
  Password: password123
  Can: Manage everything
```

---

## 📊 Data Flow Architecture

```
Frontend (TypeScript React)
    ↓
localhost:8080
    ↓
    ├─→ AuthContext (manages login/logout)
    ├─→ Pages (Dashboard, Trades, Documents, etc.)
    ├─→ API Service (calls backend)
    └─→ Components (shadcn/ui)
    
Backend (FastAPI Python)
    ↓
localhost:8000
    ↓
    ├─→ /auth/login (authenticates user)
    ├─→ /trades (CRUD operations)
    ├─→ /documents (file upload/viewing)
    ├─→ /ledger (blockchain records)
    └─→ /export (data export)
    
Database (PostgreSQL)
    ↓
tradefinance database
    ↓
    ├─→ users (4 test users)
    ├─→ organizations (4 test orgs)
    ├─→ trades (pre-loaded)
    ├─→ documents (file metadata)
    ├─→ ledger (audit trail)
    └─→ risk_scores (analytics)
```

---

## 🔄 API Integration Points

### Frontend → Backend Communication

**Authentication**
```typescript
POST /auth/login
body: { username: email, password: password }
response: { access_token, user }
```

**Trades**
```typescript
GET /trades                          // List all trades
POST /trades?seller_id=X&amount=Y    // Create trade
PUT /trades/{id}/approve             // Approve trade
PUT /trades/{id}/reject              // Reject trade
```

**Documents**
```typescript
POST /documents/upload               // Upload file
GET /documents                       // List documents
POST /documents/{id}/verify          // Verify integrity
```

**Ledger**
```typescript
GET /ledger                          // Get blockchain entries
GET /export/ledger/csv              // Export ledger
```

---

## 📦 Technology Stack

### Frontend
- **React 19**: UI framework
- **TypeScript**: Type safety
- **Vite**: Fast build tool
- **shadcn/ui**: Accessible components
- **Tailwind CSS**: Utility styles
- **React Router**: Navigation
- **React Query**: Data fetching
- **Vitest**: Testing

### Backend
- **FastAPI**: Web framework
- **SQLAlchemy**: ORM
- **PostgreSQL**: Database
- **Pydantic**: Data validation
- **JWT**: Authentication
- **MinIO**: File storage
- **Uvicorn**: ASGI server

---

## ✨ Key Features

✅ **Role-Based Access Control**
- Admin: Full system access
- Bank: Trade management, approve/reject
- Corporate: Document upload, trade viewing
- Auditor: Full audit access, data export

✅ **Trade Management**
- Create trades (Bank only)
- Approve/reject pending trades
- Track status (pending, approved, rejected)
- Blockchain ledger for all actions

✅ **Document Management**
- Upload documents (Corporate only)
- SHA256 integrity verification
- Tamper detection
- Secure storage in MinIO

✅ **Blockchain Ledger**
- Immutable audit trail
- Hash chaining
- Actor tracking
- Timestamp recording

✅ **Modern UI**
- Responsive design
- TypeScript type safety
- shadcn/ui components
- Professional styling

---

## 🧪 Testing Your Setup

### Test Complete Flow
1. Open frontend: http://localhost:8080
2. Login as bank@globalbank.com
3. Create a trade
4. Approve the trade
5. Logout and login as auditor
6. Export data
7. ✅ Everything works!

### Check Backend API
```bash
# In another terminal
curl http://localhost:8000/db-check
# Should return: {"status": "Database connection OK"}
```

### View API Documentation
```
http://localhost:8000/docs
```
Available at FastAPI's automatic interactive docs

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Frontend won't load | Check port 8080 is free, npm install, npm run dev |
| Backend connection error | Ensure backend running, check PostgreSQL |
| Login fails | Verify credentials match seed_data.py |
| Database errors | Run `python seed_data.py` to reset |
| Port already in use | Kill process or change port in config |

---

## 🎯 Next Steps

1. **Explore the UI**: Navigate through all pages
2. **Test All Roles**: Login with each test user
3. **Try All Features**: Create, approve, upload, export
4. **Check Console**: Open DevTools (F12) for API calls
5. **View Logs**: Check backend terminal for request logs

---

## 📞 System Information

- **Frontend Port**: 8080
- **Backend Port**: 8000
- **Database**: PostgreSQL (tradefinance)
- **API Format**: JSON + URL parameters
- **Authentication**: JWT Bearer tokens
- **File Storage**: MinIO (S3-compatible)

**Your system is fully integrated and ready to use!** 🎉
