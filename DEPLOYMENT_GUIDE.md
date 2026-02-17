# Trade Finance Blockchain - Production Deployment Guide

## System Overview

### Architecture
```
Frontend (New)          Backend (Python)       Database        Storage
TypeScript/React    ↔   FastAPI/SQLAlchemy  ↔  PostgreSQL  ↔  MinIO (S3)
localhost:8080         localhost:8000        tradefinance   object storage
shadcn UI              Blockchain Ledger
```

### Components
- **Frontend**: Modern TypeScript React with shadcn/ui components
- **Backend**: FastAPI with SQLAlchemy ORM and role-based access control  
- **Database**: PostgreSQL with 4 roles (admin, bank, corporate, auditor)
- **Storage**: MinIO for document storage (S3-compatible)

---

## ✅ System Status

### Running Services
- ✅ **Backend**: http://localhost:8000
  - API Documentation: http://localhost:8000/docs
  - Health Check: http://localhost:8000/db-check

- ✅ **Frontend**: http://localhost:8080
  - Modern UI with TypeScript
  - shadcn/ui component library
  - Real-time API integration

- ✅ **Database**: PostgreSQL (tradefinance)
  - Pre-loaded with test data
  - 4 test users ready

---

## 🔐 Test Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Bank | bank@globalbank.com | password123 |
| Corporate | corporate@techent.com | password123 |
| Auditor | auditor@auditorpro.com | password123 |
| Admin | admin@sysadmin.com | password123 |

---

## 📱 Frontend Features (New UI)

### Pages Available
1. **Dashboard** - Overview of trades and documents
2. **Trades** - Manage all trades with approve/reject
3. **Documents** - Upload and manage documents
4. **Risk** - Risk analysis and scoring
5. **Ledger** - Blockchain audit trail
6. **Users** (Admin only) - User management

### UI Components
- shadcn/ui Button, Card, Dialog, Table, Input
- Real-time data display
- Role-based navigation
- Responsive design
- Toast notifications
- Loading states

---

## 🔗 Backend API Endpoints

### Authentication
```bash
POST /auth/login
  body: { username, password }
  response: { access_token, user }

POST /auth/signup
  body: { email, password, org_id }
```

### Trades
```bash
# Create trade (Bank only)
POST /trades?seller_id=2&amount=50000&currency=USD

# List trades (role-filtered)
GET /trades
  response: { total, trades }

# Approve trade (Bank only)
PUT /trades/{id}/approve

# Reject trade (Bank only)
PUT /trades/{id}/reject
```

### Documents
```bash
# Upload document (Corporate only)
POST /documents/upload
  body: FormData with file

# List documents
GET /documents

# Verify integrity
POST /documents/{id}/verify
```

### Ledger
```bash
# View blockchain ledger
GET /ledger
```

### Export (Auditor/Admin only)
```bash
GET /export/trades/csv
GET /export/documents/csv
GET /export/ledger/csv
```

---

## 🚀 Starting the System

### Terminal 1 - Backend
```bash
cd c:\project\TradeFinance_Blockchain\backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 - Frontend (New)
```bash
cd c:\project\TradeFinance_Blockchain\frontend
npm run dev
# Opens on http://localhost:8080
```

### Terminal 3 - PostgreSQL (if needed)
```bash
# PostgreSQL should be running with tradefinance database
```

---

## 📊 Testing Guide

### Test 1: Login
1. Open http://localhost:8080
2. Enter: bank@globalbank.com / password123
3. ✅ Should redirect to dashboard

### Test 2: Create Trade
1. Navigate to Trades page
2. Click "Create Trade"
3. Enter Counterparty ID: 2
4. Enter Amount: 75000
5. Select Currency: EUR
6. ✅ Trade should appear in table

### Test 3: Approve Trade
1. Find pending trade
2. Click Approve
3. ✅ Status should change to "approved"

### Test 4: Upload Document
1. Logout → Login as corporate@techent.com
2. Go to Documents
3. Upload a file
4. ✅ File should appear in table

### Test 5: Export Data
1. Login as auditor@auditorpro.com
2. Go to Ledger
3. Click Export button
4. ✅ CSV file should download

---

## 🔧 Troubleshooting

### Frontend won't start
```bash
cd frontend
npm install
npm run dev
```

### Backend connection error
```bash
# Check backend is running
curl http://localhost:8000/db-check

# Restart backend
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Database issues
```bash
# Reset test data
cd backend
python seed_data.py
```

### Port conflicts
```bash
# Change frontend port in vite.config.ts
server: { port: 3000 }

# Or kill existing process
lsof -ti:8080 | xargs kill -9
```

---

## 📁 Project Structure

```
/backend
  ├── app/
  │   ├── main.py
  │   ├── database.py
  │   ├── models/          (SQLAlchemy models)
  │   ├── routes/          (API endpoints)
  │   ├── utils/           (Auth, RBAC, hashing)
  │   └── services/        (Business logic)
  ├── requirements.txt
  └── seed_data.py

/frontend
  ├── src/
  │   ├── components/      (shadcn UI components)
  │   ├── pages/           (Dashboard, Trades, etc.)
  │   ├── contexts/        (AuthContext)
  │   ├── services/        (API service)
  │   ├── types/           (TypeScript types)
  │   ├── App.tsx
  │   └── main.tsx
  ├── vite.config.ts
  ├── tsconfig.json
  ├── package.json
  └── .env
```

---

## 🔐 Security Features

✅ JWT Authentication with Bearer tokens
✅ Role-Based Access Control (RBAC)
✅ Password hashing with bcrypt
✅ SHA256 file integrity checking
✅ Blockchain ledger (hash chaining)
✅ CORS properly configured
✅ Input validation on all endpoints

---

## 📈 Monitoring & Logs

### Backend logs
```bash
# Uvicorn will show requests in terminal
# Look for 200/201 = success, 400 = bad request, 403 = forbidden
```

### Frontend console
```bash
# Open DevTools (F12) → Console tab
# Check for API errors or TypeScript issues
```

### Database queries
```python
# Set echo=True in database.py to see SQL logs
engine = create_engine(DATABASE_URL, echo=True)
```

---

## 🚢 Production Deployment

### Environment Variables (.env)
```
VITE_API_URL=https://api.tradefinance.com
POSTGRES_HOST=prod-db.example.com
POSTGRES_PORT=5432
POSTGRES_USER=prod_user
POSTGRES_PASSWORD=secure_password
```

### Backend Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations (if any)
alembic upgrade head

# Start with Gunicorn
gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

### Frontend Build
```bash
npm run build
# Creates dist/ folder - serve with nginx/apache
```

### Docker Deployment
```dockerfile
# Backend Dockerfile
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0"]

# Frontend Dockerfile
FROM node:20
WORKDIR /app
COPY package.json .
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

---

## ✨ Ready to Use

The system is fully integrated:
- ✅ Frontend connects to backend
- ✅ All APIs return real data
- ✅ Authentication working
- ✅ Tables displaying data
- ✅ All forms functional
- ✅ Export working
- ✅ Ledger tracking actions
- ✅ Role-based features active

**Start testing now at http://localhost:8080** 🎉
