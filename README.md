# Trade Finance Blockchain Explorer

A full-stack application for tamper-evident trade finance document tracking with integrated ledger, risk analysis, and RBAC (Role-Based Access Control).

## 📋 Overview

**Backend:** FastAPI + PostgreSQL + SQLAlchemy  
**Frontend:** React + Vite + Tailwind CSS  
**Features:**
- Multi-tenant document management with integrity verification
- Blockchain-style ledger with SHA-256 chaining
- Risk scoring engine
- RBAC with four roles: Admin, Bank, Corporate, Auditor
- Real-time trade workflow (create → approve/reject)
- Document tamper detection

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+** (backend)
- **Node.js 18+** (frontend)
- **PostgreSQL 12+** (database)
- **MinIO** (S3-compatible file storage, optional for dev)

### 1. Clone & Navigate
```bash
git clone <repo-url>
cd TradeFinance_Blockchain
```

### 2. Backend Setup

#### Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Configure environment (`.env` or set variables)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/trade_finance
MINIO_ENDPOINT=localhost:9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_BUCKET=trade-docs
SECRET_KEY=your-secret-key-here
```

#### Run database migrations (if using Alembic)
```bash
alembic upgrade head
```

#### Start the backend server
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at **http://localhost:8000**

### 3. Frontend Setup

#### Install dependencies
```bash
cd trade-frontend
npm install
```

#### Start the dev server
```bash
npm run dev
```

Frontend will be available at **http://localhost:5174/**

---

## 🔐 Default Test Credentials

| Role      | Email                      | Password  |
|-----------|----------------------------|-----------|
| Admin     | admin@tradefinance.com     | admin123  |
| Bank      | bank@tradefinance.com      | bank123   |
| Corporate | corporate@tradefinance.com | corp123   |
| Auditor   | auditor@tradefinance.com   | audit123  |

---

## 📖 API Endpoints

### Authentication
```
POST   /auth/login           - Login (returns JWT token)
POST   /auth/register        - Register new user
POST   /auth/logout          - Logout
```

### Organizations
```
GET    /organizations        - List all organizations
POST   /organizations        - Create organization (admin-only)
GET    /organizations/{id}   - Get organization details
```

### Trades
```
POST   /trades                    - Create trade (bank/admin)
GET    /trades                    - List trades (scoped by role)
GET    /trades/{id}               - Get trade details
PUT    /trades/{id}/approve       - Approve trade (bank-only)
PUT    /trades/{id}/reject        - Reject trade (bank-only)
```

### Documents
```
POST   /documents/upload          - Upload document (corporate/admin)
GET    /documents                 - List documents (scoped by role)
GET    /documents/{id}            - Get document details
DELETE /documents/{id}            - Delete document (admin-only)
POST   /documents/{id}/verify      - Verify document integrity (auditor)
```

### Ledger
```
GET    /ledger                    - List all ledger entries
GET    /ledger/{id}/verify        - Verify ledger chain integrity
```

### Risk & Analytics
```
GET    /risk/scores               - Get risk scores
GET    /analytics/trades          - Trade analytics
GET    /export/trades.csv         - Export trades as CSV
```

---

## 🔄 Sample Workflow

### 1. **Login**
Navigate to http://localhost:5174/ → Login with Bank credentials

### 2. **Create Trade**
On Bank Dashboard → "Create Trade" form:
- **Counterparty (Org ID):** Enter target organization ID (e.g., 1)
- **Amount:** 50000
- **Currency:** USD
- Click **Create Trade**

### 3. **Upload Document (Corporate)**
Switch to Corporate user → Documents page:
- Click **Upload**
- Select a file
- Document will be scanned for tampering

### 4. **Approve/Reject (Bank)**
Back to Bank Dashboard → Trade row:
- Click status dropdown → **APPROVED** or **REJECTED**
- Bank will check linked documents for tampering before approval

### 5. **View Ledger (Auditor)**
Switch to Auditor user → Ledger page:
- View all transactions with hashes
- Verify chain integrity

---

## 🛠️ Development

### Project Structure
```
TradeFinance_Blockchain/
├── backend/
│   ├── app/
│   │   ├── main.py              - FastAPI app entry point
│   │   ├── database.py          - Database connection
│   │   ├── models/              - SQLAlchemy ORM models
│   │   ├── routes/              - API endpoints
│   │   ├── schemas/             - Pydantic schemas
│   │   ├── services/            - Business logic
│   │   ├── utils/               - Utilities (auth, RBAC, risk, etc.)
│   │   └── core/                - Core config (MinIO, etc.)
│   └── requirements.txt
├── trade-frontend/
│   ├── src/
│   │   ├── main.jsx             - App entry
│   │   ├── App.jsx              - Root component
│   │   ├── index.css            - Global + Tailwind styles
│   │   ├── App.css              - Custom animations
│   │   ├── api/
│   │   │   └── axios.js         - Axios client with JWT interceptor
│   │   ├── components/          - UI components
│   │   ├── context/             - React context (Auth)
│   │   ├── layouts/             - Layout components
│   │   └── pages/               - Page components
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

### Key Files

**Backend RBAC:**
- `backend/app/utils/rbac.py` - Role definitions & permission checks
- Uses `@require_roles(["role1", "role2"])` dependency decorator

**Frontend Auth:**
- `trade-frontend/src/context/AuthContext.jsx` - Auth state management
- `trade-frontend/src/api/axios.js` - Axios with JWT interceptor
- `trade-frontend/src/components/ProtectedRoute.jsx` - Route guards

**Styling:**
- `trade-frontend/src/index.css` - Tailwind + custom utilities (`.btn`, `.card`, `.form-*`, `.badge`, `.alert`)
- `trade-frontend/src/App.css` - Animations & custom styles

---

## 🧪 Testing

### Unit Tests (Backend)
Create `tests/test_auth.py`, `tests/test_trades.py`, etc.:
```bash
pytest tests/ -v
```

### End-to-End (Manual)
1. Start backend + frontend (see Quick Start)
2. Follow **Sample Workflow** above
3. Check:
   - ✅ Login redirects by role
   - ✅ Trade creation with validation
   - ✅ Document upload & tamper detection
   - ✅ Approval workflow (pending → approved/rejected)
   - ✅ Ledger entries created with correct hashes
   - ✅ RBAC: unauthorized requests return 403

### API Testing (Postman/curl)
```bash
# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=bank@tradefinance.com&password=bank123"

# Create Trade
curl -X POST "http://localhost:8000/trades?seller_id=1&amount=50000&currency=USD" \
  -H "Authorization: Bearer <TOKEN>"

# List Trades
curl -X GET http://localhost:8000/trades \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 🔧 Configuration

### Backend `.env`
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/trade_finance

# JWT
SECRET_KEY=your-256-bit-secret-key-here
TOKEN_EXPIRE_MINUTES=60

# MinIO (S3)
MINIO_ENDPOINT=localhost:9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_BUCKET=trade-docs
MINIO_SECURE=False

# CORS (dev: allow all; prod: restrict)
ALLOWED_ORIGINS=http://localhost:5174,http://localhost:3000

# Server
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
```

### Frontend Axios Configuration (`src/api/axios.js`)
- **Base URL:** `http://localhost:8000` (change in production)
- **Timeout:** 10000ms
- **JWT Token:** Automatically injected from `localStorage.access_token`

---

## 📊 Database Schema

### Key Tables
- `users` - Auth users with roles
- `organizations` - Multi-tenant orgs
- `documents` - Uploaded files with integrity hash
- `trade_transactions` - Trades (initiator, counterparty, status, is_tampered)
- `ledger_entries` - Blockchain-style ledger with SHA-256 chain
- `risk_scores` - Risk assessment per organization/trade

### Trade Status Flow
```
PENDING → APPROVED → COMPLETED
     ↘
      REJECTED
```

### Document Integrity
- **Hash Calculation:** SHA-256(file_content)
- **Comparison:** Recalculated vs. stored hash on verification
- **Tampered Flag:** Set if hashes don't match

---

## 🐛 Troubleshooting

### Backend Won't Start
```
Error: [Errno 98] Address already in use :8000
```
**Fix:** Kill process on port 8000 or use a different port:
```bash
python -m uvicorn app.main:app --port 8001
```

### Database Connection Failed
```
Error: postgresql driver not found
```
**Fix:** Install psycopg2:
```bash
pip install psycopg2-binary
```

### Tailwind Classes Not Working
```
Error: Unknown utility class `bg-gray-50`
```
**Fix:** Ensure `@tailwind` directives are in `index.css` and rebuild:
```bash
npm run dev
```

### JWT Token Expired
- Tokens expire after `TOKEN_EXPIRE_MINUTES` (default 60)
- Frontend will redirect to login on 401 response

### CORS Issues
```
Error: Access to XMLHttpRequest blocked by CORS
```
**Fix:** Update `ALLOWED_ORIGINS` in backend `.env` and restart server

---

## 📝 API Response Format

### Success
```json
{
  "trades": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "initiator_id": 1,
      "counterparty_id": 2,
      "amount": 50000,
      "currency": "USD",
      "status": "approved",
      "is_tampered": false
    }
  ],
  "total": 1
}
```

### Error
```json
{
  "detail": "Forbidden: You do not have permission to access this resource"
}
```

---

## 🚀 Deployment

### Production Checklist
- [ ] Use `gunicorn` + `uvicorn` (backend):
  ```bash
  gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
  ```
- [ ] Use `npm run build` + serve with static server (frontend)
- [ ] Set up HTTPS/SSL certificates
- [ ] Use strong `SECRET_KEY` (generate with `secrets.token_urlsafe(32)`)
- [ ] Restrict `ALLOWED_ORIGINS` in CORS
- [ ] Migrate from SQLite to PostgreSQL in production
- [ ] Set up MinIO or S3 for file storage
- [ ] Enable audit logging
- [ ] Use environment variables (never commit `.env`)

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support

For issues, questions, or feedback:
- Open a GitHub issue
- Email: support@tradefinance.local
- Check existing documentation

---

**Happy trading! 🎉**
