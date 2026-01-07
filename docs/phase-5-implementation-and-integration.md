# Trade Finance Blockchain Explorer
## Phase 5 – Implementation & Integration

---

## 1. Phase Overview

**Purpose:** Convert Phase 3 (Backend Design) and Phase 4 (Frontend Design) into a working MVP system.

**What Phase 5 Delivers:**
- Fully functional backend API (FastAPI + PostgreSQL)
- Fully functional frontend UI (React + Tailwind)
- End-to-end integration (JWT auth, document upload, ledger, verification)
- Working demo system ready for user acceptance testing

**What Phase 5 Does NOT Include:**
- Trade transactions (Week 5+)
- Risk scoring (Week 7+)
- Analytics dashboard (Week 8+)
- Production deployment (Phase 6)
- Docker/CI/CD (Phase 6)

**Implementation Order:**
1. Backend foundation (database, auth, APIs)
2. Frontend foundation (setup, auth, routing)
3. Integration testing (connect frontend to backend)
4. Demo walkthrough (end-to-end user flow)

---

## 2. Repository Structure (Final)

```
trade-finance-blockchain-explorer/
├── backend/
│   ├── alembic/
│   │   ├── versions/
│   │   │   └── 001_initial_schema.py
│   │   ├── env.py
│   │   └── script.py.mako
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── deps.py
│   │   │   ├── auth.py
│   │   │   ├── documents.py
│   │   │   └── ledger.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── security.py
│   │   │   └── hashing.py
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   └── session.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── document.py
│   │   │   ├── ledger.py
│   │   │   ├── trade.py
│   │   │   ├── risk.py
│   │   │   └── audit.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── document.py
│   │   │   └── ledger.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── document_service.py
│   │   │   └── ledger_service.py
│   │   ├── __init__.py
│   │   ├── config.py
│   │   └── main.py
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_auth.py
│   │   └── test_documents.py
│   ├── .env.example
│   ├── .gitignore
│   ├── alembic.ini
│   ├── requirements.txt
│   └── README.md
│
├── frontend/
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── documents/
│   │   │   │   ├── DocumentCard.tsx
│   │   │   │   ├── DocumentList.tsx
│   │   │   │   └── UploadForm.tsx
│   │   │   ├── ledger/
│   │   │   │   └── LedgerTimeline.tsx
│   │   │   └── common/
│   │   │       ├── Button.tsx
│   │   │       ├── StatusBadge.tsx
│   │   │       └── LoadingSpinner.tsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── RegisterPage.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardPage.tsx
│   │   │   ├── documents/
│   │   │   │   ├── DocumentsListPage.tsx
│   │   │   │   ├── DocumentDetailsPage.tsx
│   │   │   │   └── UploadDocumentPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   ├── documentService.ts
│   │   │   └── ledgerService.ts
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── routes/
│   │   │   ├── AppRoutes.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── types/
│   │   │   ├── auth.types.ts
│   │   │   ├── document.types.ts
│   │   │   └── ledger.types.ts
│   │   ├── utils/
│   │   │   ├── formatDate.ts
│   │   │   └── constants.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── .env.local
│   ├── .env.example
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── README.md
│
├── docs/
│   ├── phase-1-system-design.md
│   ├── phase-2-database-design.md
│   ├── phase-3-backend-implementation.md
│   ├── phase-4-frontend-implementation.md
│   └── phase-5-implementation-and-integration.md
│
├── .gitignore
└── README.md
```

---

## 3. Backend Implementation Checklist

### 3.1 Environment Setup

**Step 1: Create virtual environment**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

**Step 2: Install dependencies**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Step 3: Create `.env` file**
```bash
cp .env.example .env
# Edit .env with your settings
```

**Example `.env`:**
```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/trade_finance

# JWT
SECRET_KEY=your-super-secret-key-change-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15

# S3 (use MinIO for local development)
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_REGION=us-east-1
S3_BUCKET_NAME=trade-finance-documents
S3_ENDPOINT_URL=http://localhost:9000

# CORS
CORS_ORIGINS=http://localhost:5173
```

**Step 4: Start PostgreSQL**
```bash
# Option 1: Local PostgreSQL
sudo systemctl start postgresql

# Option 2: Docker (recommended)
docker run --name postgres-trade-finance \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=trade_finance \
  -p 5432:5432 \
  -d postgres:14
```

**Step 5: Start MinIO (S3-compatible storage)**
```bash
docker run --name minio-trade-finance \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -d quay.io/minio/minio server /data --console-address ":9001"

# Create bucket via MinIO console at http://localhost:9001
# Login: minioadmin / minioadmin
# Create bucket: trade-finance-documents
```

---

### 3.2 Database Setup

**Step 1: Initialize Alembic**
```bash
alembic upgrade head
```

**Expected Output:**
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 001, Initial schema
```

**Step 2: Verify tables created**
```bash
psql -U postgres -d trade_finance -c "\dt"
```

**Expected Tables:**
- users
- documents
- ledger_entries
- trade_transactions
- risk_scores
- audit_logs

---

### 3.3 Implementation Checklist

#### ✅ Core Infrastructure (Day 1)
- [ ] `app/config.py` - Environment configuration
- [ ] `app/db/base.py` - SQLAlchemy Base class
- [ ] `app/db/session.py` - Database session factory
- [ ] `app/main.py` - FastAPI app with CORS

#### ✅ Models (Day 1-2)
- [ ] `app/models/user.py` - User model with UserRole enum
- [ ] `app/models/document.py` - Document model with DocumentType enum
- [ ] `app/models/ledger.py` - LedgerEntry model with LedgerAction enum
- [ ] `app/models/trade.py` - TradeTransaction model (schema only, no APIs yet)
- [ ] `app/models/risk.py` - RiskScore model (schema only, no APIs yet)
- [ ] `app/models/audit.py` - AuditLog model

#### ✅ Schemas (Day 2)
- [ ] `app/schemas/user.py` - UserCreate, UserResponse, Token, TokenData
- [ ] `app/schemas/document.py` - DocumentCreate, DocumentResponse
- [ ] `app/schemas/ledger.py` - LedgerEntryCreate, LedgerEntryResponse

#### ✅ Security & Hashing (Day 2)
- [ ] `app/core/security.py` - Password hashing, JWT creation/decoding
- [ ] `app/core/hashing.py` - SHA-256 file hashing

#### ✅ Dependencies (Day 3)
- [ ] `app/api/deps.py` - get_current_user, require_roles

#### ✅ Auth Service & API (Day 3)
- [ ] `app/services/auth_service.py` - register_user, login_user
- [ ] `app/api/auth.py` - POST /auth/register, POST /auth/login, GET /auth/me

#### ✅ Document Service & API (Day 4-5)
- [ ] `app/services/document_service.py` - upload_document, list_documents, verify_document_hash
- [ ] `app/api/documents.py` - POST /documents/upload, GET /documents, GET /documents/{id}, GET /documents/{id}/verify

#### ✅ Ledger Service & API (Day 5)
- [ ] `app/services/ledger_service.py` - create_entry, get_document_timeline
- [ ] `app/api/ledger.py` - POST /ledger/entries, GET /ledger/documents/{doc_id}

#### ✅ Testing (Day 6)
- [ ] Manual testing via Swagger UI at `http://localhost:8000/docs`
- [ ] Test register → login → upload → verify flow
- [ ] Verify JWT token in responses
- [ ] Verify hash computation works

---

### 3.4 Running Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Verify:**
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

---

## 4. Frontend Implementation Checklist

### 4.1 Environment Setup

**Step 1: Create Vite project**
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

**Step 2: Install dependencies**
```bash
npm install axios react-router-dom jwt-decode
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Step 3: Configure Tailwind**

**`tailwind.config.js`:**
```js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**`src/index.css`:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 4: Create `.env.local`**
```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

### 4.2 Implementation Checklist

#### ✅ Core Setup (Day 1)
- [ ] Tailwind configured in `index.css`
- [ ] Vite running on port 5173
- [ ] `src/types/` folder with TypeScript types
- [ ] `src/utils/constants.ts` with document types, roles

#### ✅ API Services (Day 2)
- [ ] `src/services/api.ts` - Axios instance with interceptors
- [ ] `src/services/authService.ts` - login, register, getCurrentUser
- [ ] `src/services/documentService.ts` - getDocuments, uploadDocument, verifyDocument
- [ ] `src/services/ledgerService.ts` - getDocumentLedger, createLedgerEntry

#### ✅ Auth Context (Day 2)
- [ ] `src/context/AuthContext.tsx` - JWT storage, user state
- [ ] `src/hooks/useAuth.ts` - Access auth context

#### ✅ Routing (Day 3)
- [ ] `src/routes/ProtectedRoute.tsx` - Auth + role checking
- [ ] `src/routes/AppRoutes.tsx` - All routes defined

#### ✅ Auth Pages (Day 3)
- [ ] `src/pages/auth/LoginPage.tsx` - Login form
- [ ] `src/pages/auth/RegisterPage.tsx` - Register form

#### ✅ Layout Components (Day 4)
- [ ] `src/components/layout/Navbar.tsx` - Top nav with user info
- [ ] `src/components/layout/Sidebar.tsx` - Left navigation

#### ✅ Common Components (Day 4)
- [ ] `src/components/common/Button.tsx` - Reusable button
- [ ] `src/components/common/StatusBadge.tsx` - Role/status badges
- [ ] `src/components/common/LoadingSpinner.tsx` - Loading indicator

#### ✅ Dashboard (Day 5)
- [ ] `src/pages/dashboard/DashboardPage.tsx` - Welcome + quick stats

#### ✅ Documents Pages (Day 6-7)
- [ ] `src/pages/documents/DocumentsListPage.tsx` - List all documents
- [ ] `src/pages/documents/UploadDocumentPage.tsx` - Upload form
- [ ] `src/pages/documents/DocumentDetailsPage.tsx` - Details + ledger

#### ✅ Document Components (Day 7)
- [ ] `src/components/documents/DocumentCard.tsx` - Document summary card
- [ ] `src/components/documents/DocumentList.tsx` - Grid of cards
- [ ] `src/components/documents/UploadForm.tsx` - Upload form UI

#### ✅ Ledger Components (Day 8)
- [ ] `src/components/ledger/LedgerTimeline.tsx` - Timeline view

#### ✅ Integration Testing (Day 9)
- [ ] Register user via UI
- [ ] Login via UI
- [ ] Upload document via UI
- [ ] View documents list
- [ ] View document details
- [ ] Verify document hash
- [ ] View ledger timeline

---

### 4.3 Running Frontend

```bash
cd frontend
npm run dev
```

**Verify:**
- App running: http://localhost:5173
- Login page loads
- No console errors

---

## 5. Integration Flow

### 5.1 Authentication Flow

```
┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐
│   Browser   │                    │   Frontend  │                    │   Backend   │
│   (User)    │                    │    (React)  │                    │  (FastAPI)  │
└──────┬──────┘                    └──────┬──────┘                    └──────┬──────┘
       │                                  │                                  │
       │  1. Enter credentials            │                                  │
       ├─────────────────────────────────>│                                  │
       │                                  │                                  │
       │                                  │  2. POST /auth/login             │
       │                                  │  {email, password}               │
       │                                  ├─────────────────────────────────>│
       │                                  │                                  │
       │                                  │                                  │  3. Verify password
       │                                  │                                  │     (bcrypt)
       │                                  │                                  │
       │                                  │  4. {access_token: "eyJ..."}     │
       │                                  │<─────────────────────────────────┤
       │                                  │                                  │
       │                                  │  5. Decode JWT                   │
       │                                  │     Extract: user_id, role, org  │
       │                                  │  6. Store in localStorage        │
       │                                  │                                  │
       │  7. Redirect to /dashboard       │                                  │
       │<─────────────────────────────────┤                                  │
       │                                  │                                  │
```

### 5.2 Protected Request Flow

```
┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐
│   Browser   │                    │   Frontend  │                    │   Backend   │
└──────┬──────┘                    └──────┬──────┘                    └──────┬──────┘
       │                                  │                                  │
       │  1. Click "Documents"            │                                  │
       ├─────────────────────────────────>│                                  │
       │                                  │                                  │
       │                                  │  2. GET /documents               │
       │                                  │  Header: Authorization           │
       │                                  │  Bearer eyJhbGci...              │
       │                                  ├─────────────────────────────────>│
       │                                  │                                  │
       │                                  │                                  │  3. Extract JWT
       │                                  │                                  │     Verify signature
       │                                  │                                  │     Decode payload
       │                                  │                                  │
       │                                  │                                  │  4. Check role
       │                                  │                                  │     Query DB
       │                                  │                                  │     WHERE owner_id = ?
       │                                  │                                  │
       │                                  │  5. [documents]                  │
       │                                  │<─────────────────────────────────┤
       │                                  │                                  │
       │                                  │  6. Render documents             │
       │                                  │                                  │
       │  7. Show documents list          │                                  │
       │<─────────────────────────────────┤                                  │
       │                                  │                                  │
```

### 5.3 Document Upload Flow

```
┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐
│   Browser   │                    │   Frontend  │                    │   Backend   │                    │     S3      │
└──────┬──────┘                    └──────┬──────┘                    └──────┬──────┘                    └──────┬──────┘
       │                                  │                                  │                                  │
       │  1. Select file + fill form      │                                  │                                  │
       ├─────────────────────────────────>│                                  │                                  │
       │                                  │                                  │                                  │
       │                                  │  2. POST /documents/upload       │                                  │
       │                                  │  multipart/form-data             │                                  │
       │                                  │  {file, doc_type, doc_number}    │                                  │
       │                                  ├─────────────────────────────────>│                                  │
       │                                  │                                  │                                  │
       │                                  │                                  │  3. Read file bytes              │
       │                                  │                                  │     Compute SHA-256              │
       │                                  │                                  │     hash = "abc123..."           │
       │                                  │                                  │                                  │
       │                                  │                                  │  4. PUT file to S3               │
       │                                  │                                  ├─────────────────────────────────>│
       │                                  │                                  │                                  │
       │                                  │                                  │  5. S3 URL                       │
       │                                  │                                  │<─────────────────────────────────┤
       │                                  │                                  │                                  │
       │                                  │                                  │  6. INSERT INTO documents        │
       │                                  │                                  │     (hash, file_url, ...)        │
       │                                  │                                  │                                  │
       │                                  │                                  │  7. INSERT INTO ledger_entries   │
       │                                  │                                  │     (action: ISSUED)             │
       │                                  │                                  │                                  │
       │                                  │  8. {id, hash, ...}              │                                  │
       │                                  │<─────────────────────────────────┤                                  │
       │                                  │                                  │                                  │
       │                                  │  9. Navigate to /documents/{id}  │                                  │
       │                                  │                                  │                                  │
       │  10. Show document details       │                                  │                                  │
       │<─────────────────────────────────┤                                  │                                  │
       │                                  │                                  │                                  │
```

### 5.4 Hash Verification Flow

```
┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐
│   Browser   │                    │   Frontend  │                    │   Backend   │                    │     S3      │
└──────┬──────┘                    └──────┬──────┘                    └──────┬──────┘                    └──────┬──────┘
       │                                  │                                  │                                  │
       │  1. Click "Verify Hash"          │                                  │                                  │
       ├─────────────────────────────────>│                                  │                                  │
       │                                  │                                  │                                  │
       │                                  │  2. GET /documents/{id}/verify   │                                  │
       │                                  ├─────────────────────────────────>│                                  │
       │                                  │                                  │                                  │
       │                                  │                                  │  3. SELECT hash FROM documents   │
       │                                  │                                  │     WHERE id = ?                 │
       │                                  │                                  │     stored_hash = "abc123..."    │
       │                                  │                                  │                                  │
       │                                  │                                  │  4. GET file from S3             │
       │                                  │                                  ├─────────────────────────────────>│
       │                                  │                                  │                                  │
       │                                  │                                  │  5. File bytes                   │
       │                                  │                                  │<─────────────────────────────────┤
       │                                  │                                  │                                  │
       │                                  │                                  │  6. Re-compute SHA-256           │
       │                                  │                                  │     current_hash = "abc123..."   │
       │                                  │                                  │                                  │
       │                                  │                                  │  7. Compare hashes               │
       │                                  │                                  │     is_valid = (stored == current)│
       │                                  │                                  │                                  │
       │                                  │                                  │  8. INSERT INTO ledger_entries   │
       │                                  │                                  │     (action: VERIFIED)           │
       │                                  │                                  │                                  │
       │                                  │  9. {stored_hash, current_hash,  │                                  │
       │                                  │      is_valid: true}             │                                  │
       │                                  │<─────────────────────────────────┤                                  │
       │                                  │                                  │                                  │
       │                                  │  10. Show ✅ "Document verified" │                                  │
       │                                  │                                  │                                  │
       │  11. Display verification result │                                  │                                  │
       │<─────────────────────────────────┤                                  │                                  │
       │                                  │                                  │                                  │
```

---

## 6. Demo Scenario (End-to-End Walkthrough)

### Prerequisites
- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:5173`
- PostgreSQL and MinIO running

---

### Step 1: Register Corporate User

**Action:** Navigate to http://localhost:5173/register

**Fill form:**
- Name: `John Doe`
- Email: `john@acmecorp.com`
- Password: `SecurePass123`
- Role: `corporate`
- Organization: `ACME Corp`

**Click:** "Register"

**Expected Result:**
- Success message: "Registration successful! Please login."
- Redirect to `/login`

**Backend Log:**
```
INFO: POST /api/v1/auth/register - 201 Created
```

**Database Check:**
```sql
SELECT id, email, role, org_name FROM users WHERE email = 'john@acmecorp.com';
```

---

### Step 2: Login

**Action:** Enter credentials on login page

**Fill form:**
- Email: `john@acmecorp.com`
- Password: `SecurePass123`

**Click:** "Login"

**Expected Result:**
- JWT token stored in `localStorage`
- Redirect to `/dashboard`
- Navbar shows: "Welcome, John Doe" with "CORPORATE" badge

**Backend Log:**
```
INFO: POST /api/v1/auth/login - 200 OK
```

**Browser DevTools (Application tab):**
```
localStorage:
  access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Decoded JWT payload:**
```json
{
  "user_id": 1,
  "email": "john@acmecorp.com",
  "role": "corporate",
  "org_name": "ACME Corp",
  "exp": 1704715200
}
```

---

### Step 3: Upload Document

**Action:** Click "Upload Document" in sidebar

**Navigate to:** `/documents/upload`

**Fill form:**
- File: Select `invoice_001.pdf` from computer
- Document Type: `INVOICE`
- Document Number: `INV-2026-001`
- Issued Date: `2026-01-05`

**Click:** "Upload"

**Expected Result:**
- Loading spinner appears
- Success message: "Document uploaded successfully"
- Redirect to `/documents/{id}` (e.g., `/documents/1`)

**Backend Log:**
```
INFO: POST /api/v1/documents/upload - 201 Created
INFO: Computed SHA-256 hash: a3f5b8c9d2e1f4g7h8i9j0k1l2m3n4o5
INFO: Uploaded to S3: documents/ACME Corp/a3f5b8c9_invoice_001.pdf
INFO: Created ledger entry: ISSUED by user_id=1
```

**Database Check:**
```sql
SELECT id, doc_type, doc_number, hash, file_url FROM documents WHERE id = 1;
-- Result:
-- id | doc_type | doc_number   | hash                                 | file_url
-- 1  | INVOICE  | INV-2026-001 | a3f5b8c9d2e1f4g7h8i9j0k1l2m3n4o5    | documents/ACME Corp/...

SELECT action, actor_id, created_at FROM ledger_entries WHERE document_id = 1;
-- Result:
-- action | actor_id | created_at
-- ISSUED | 1        | 2026-01-07 10:30:00
```

**MinIO Check:**
- Navigate to http://localhost:9001
- Bucket: `trade-finance-documents`
- Object: `documents/ACME Corp/a3f5b8c9_invoice_001.pdf` exists

---

### Step 4: View Document Details

**Current page:** `/documents/1`

**Expected UI:**
```
┌─────────────────────────────────────────────────────────┐
│  Document Details                                       │
├─────────────────────────────────────────────────────────┤
│  Type: INVOICE                                          │
│  Number: INV-2026-001                                   │
│  Issued: January 5, 2026                                │
│  Owner: ACME Corp                                       │
│  Hash: a3f5b8c9... (first 8 chars + ellipsis)          │
│                                                         │
│  [Download] [Verify Hash]                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Ledger Timeline                                        │
├─────────────────────────────────────────────────────────┤
│  🟢 ISSUED                                              │
│     by John Doe (ACME Corp)                             │
│     January 7, 2026 at 10:30 AM                         │
└─────────────────────────────────────────────────────────┘
```

---

### Step 5: Register Auditor User (New Browser/Incognito)

**Action:** Open new incognito window, navigate to http://localhost:5173/register

**Fill form:**
- Name: `Jane Smith`
- Email: `jane@auditfirm.com`
- Password: `AuditorPass456`
- Role: `auditor`
- Organization: `Audit Firm LLP`

**Click:** "Register" then "Login"

**Expected Result:**
- Logged in as auditor
- Navbar shows: "Welcome, Jane Smith" with "AUDITOR" badge

---

### Step 6: Auditor Views All Documents

**Action:** Click "Documents" in sidebar

**Navigate to:** `/documents`

**Expected Result:**
- Document list shows `INV-2026-001` (even though Jane is from different org)
- Auditor can see all documents (backend enforces this)

**Backend Log:**
```
INFO: GET /api/v1/documents - 200 OK
INFO: User role=auditor, returning all documents
```

---

### Step 7: Auditor Verifies Document

**Action:** Click "View Details" on document

**Navigate to:** `/documents/1`

**Click:** "Verify Hash"

**Expected Result:**
- Loading spinner
- Success message: "✅ Document is authentic"
- Display:
  - Stored hash: `a3f5b8c9d2e1f4g7h8i9j0k1l2m3n4o5`
  - Current hash: `a3f5b8c9d2e1f4g7h8i9j0k1l2m3n4o5`
  - Status: ✅ Valid

**Backend Log:**
```
INFO: GET /api/v1/documents/1/verify - 200 OK
INFO: Downloaded file from S3
INFO: Re-computed hash: a3f5b8c9d2e1f4g7h8i9j0k1l2m3n4o5
INFO: Hash match: True
INFO: Created ledger entry: VERIFIED by user_id=2
```

**Database Check:**
```sql
SELECT action, actor_id, created_at FROM ledger_entries WHERE document_id = 1 ORDER BY created_at;
-- Result:
-- action   | actor_id | created_at
-- ISSUED   | 1        | 2026-01-07 10:30:00
-- VERIFIED | 2        | 2026-01-07 11:15:00
```

---

### Step 8: Auditor Views Updated Ledger

**Current page:** `/documents/1` (refresh page)

**Expected UI:**
```
┌─────────────────────────────────────────────────────────┐
│  Ledger Timeline                                        │
├─────────────────────────────────────────────────────────┤
│  🟢 ISSUED                                              │
│     by John Doe (ACME Corp)                             │
│     January 7, 2026 at 10:30 AM                         │
│                                                         │
│  🔵 VERIFIED                                            │
│     by Jane Smith (Audit Firm LLP)                      │
│     January 7, 2026 at 11:15 AM                         │
│     ✓ Hash verification passed                          │
└─────────────────────────────────────────────────────────┘
```

---

### Step 9: Test Tamper Detection (Optional Advanced Test)

**Action (Backend):** Manually modify file in MinIO or database hash

**Option 1: Modify file in S3**
```bash
# Upload different file with same name via MinIO console
# This simulates file tampering
```

**Option 2: Modify hash in database**
```sql
UPDATE documents SET hash = 'tampered_hash_xxxxx' WHERE id = 1;
```

**Action (Frontend):** Click "Verify Hash" again

**Expected Result:**
- Error message: "❌ Document may be tampered"
- Display:
  - Stored hash: `tampered_hash_xxxxx`
  - Current hash: `a3f5b8c9d2e1f4g7h8i9j0k1l2m3n4o5`
  - Status: ❌ Invalid (mismatch)

**This proves the integrity checking works!**

---

## 7. Agile Scope Control

### ✅ Implemented in Phase 5 (MVP Complete)

**Backend:**
- [x] User registration with password hashing (bcrypt)
- [x] User login with JWT token generation
- [x] JWT validation middleware
- [x] Role-based access control (require_roles decorator)
- [x] Document upload to S3 with SHA-256 hashing
- [x] Documents list API (role-scoped: own docs vs all docs)
- [x] Document details API
- [x] Hash verification API (re-compute from S3, compare)
- [x] Ledger entries creation (automatic on upload)
- [x] Ledger timeline API (chronological events)
- [x] Database migrations (Alembic)
- [x] Swagger API documentation

**Frontend:**
- [x] Login page with form validation
- [x] Register page with role selection
- [x] JWT token storage (localStorage)
- [x] Axios interceptors (attach token, handle 401)
- [x] Protected routes with role checking
- [x] Dashboard page (welcome message + quick stats)
- [x] Documents list page (grid/table view)
- [x] Document upload page (file + metadata form)
- [x] Document details page (metadata + hash display)
- [x] Ledger timeline component (vertical timeline)
- [x] Hash verification UI (button + result display)
- [x] Navbar with user info and logout
- [x] Sidebar navigation
- [x] Loading states and error handling
- [x] Role-based UI visibility (hide upload for auditors)

**Integration:**
- [x] End-to-end auth flow (register → login → JWT → protected pages)
- [x] Document upload flow (file → S3 → hash → DB → ledger)
- [x] Hash verification flow (fetch S3 → re-hash → compare → ledger)
- [x] Role-based data scoping (corporate sees own, auditor sees all)

---

### ❌ NOT Implemented in Phase 5 (Deferred)

**Week 5+ Features:**
- [ ] Trade transactions UI and API
- [ ] Link documents to trades
- [ ] Trade status updates

**Week 6+ Features:**
- [ ] Celery background worker setup
- [ ] Automated integrity checks (scheduled job)
- [ ] Alert admin on hash mismatch

**Week 7+ Features:**
- [ ] Risk score calculation logic
- [ ] Risk scores API and UI
- [ ] Mock UNCTAD/WTO data integration

**Week 8+ Features:**
- [ ] Analytics dashboard (KPIs, charts)
- [ ] CSV export
- [ ] PDF report generation

**Post-MVP Features:**
- [ ] Refresh token rotation
- [ ] Email notifications
- [ ] Two-factor authentication (2FA)
- [ ] Real-time updates (WebSocket)
- [ ] Mobile responsive design (full optimization)
- [ ] Dark mode
- [ ] Advanced search and filters
- [ ] File preview (PDF viewer in browser)
- [ ] User profile editing
- [ ] Admin user management UI

---

## 8. Testing Strategy

### 8.1 Backend Testing (Manual via Swagger)

**Navigate to:** http://localhost:8000/docs

**Test Sequence:**

1. **POST /auth/register**
   - Input: `{"name": "Test User", "email": "test@example.com", "password": "test123", "role": "corporate", "org_name": "Test Corp"}`
   - Expected: 201 Created, user object returned

2. **POST /auth/login**
   - Input: `{"email": "test@example.com", "password": "test123"}`
   - Expected: 200 OK, `{"access_token": "eyJ...", "token_type": "bearer"}`
   - **Copy token for next requests**

3. **GET /auth/me**
   - Headers: `Authorization: Bearer {token}`
   - Expected: 200 OK, user profile returned

4. **POST /documents/upload** (use "Try it out")
   - File: Upload any PDF
   - doc_type: "INVOICE"
   - doc_number: "TEST-001"
   - issued_at: "2026-01-07T10:00:00"
   - Expected: 201 Created, document object with hash

5. **GET /documents**
   - Headers: `Authorization: Bearer {token}`
   - Expected: 200 OK, array with uploaded document

6. **GET /documents/{id}**
   - Expected: 200 OK, document details

7. **GET /documents/{id}/verify**
   - Expected: 200 OK, `{"is_valid": true, "stored_hash": "...", "current_hash": "..."}`

8. **GET /ledger/documents/{doc_id}**
   - Expected: 200 OK, array with ISSUED and VERIFIED entries

---

### 8.2 Frontend Testing (Manual)

**Test Sequence:**

1. **Registration Flow**
   - Navigate to `/register`
   - Fill all fields
   - Submit form
   - Verify redirect to `/login`

2. **Login Flow**
   - Enter credentials
   - Submit form
   - Verify JWT in localStorage (DevTools → Application → Local Storage)
   - Verify redirect to `/dashboard`
   - Verify navbar shows user name and role badge

3. **Protected Route**
   - Logout
   - Try to navigate to `/documents` directly
   - Verify redirect to `/login`

4. **Upload Flow**
   - Login as corporate user
   - Navigate to `/documents/upload`
   - Select file, fill form
   - Submit
   - Verify redirect to document details page
   - Verify hash displayed

5. **Documents List**
   - Navigate to `/documents`
   - Verify document appears in list
   - Click "View Details"
   - Verify details page loads

6. **Ledger Timeline**
   - On document details page
   - Verify "ISSUED" entry appears with timestamp
   - Verify actor name matches uploader

7. **Hash Verification**
   - Click "Verify Hash" button
   - Wait for result
   - Verify "✅ Document is authentic" message
   - Refresh page
   - Verify "VERIFIED" entry added to ledger timeline

8. **Role-Based Access**
   - Logout corporate user
   - Register and login as auditor
   - Navigate to `/documents`
   - Verify can see documents from other orgs
   - Verify upload button is hidden

---

### 8.3 Integration Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Frontend can reach backend API (CORS configured)
- [ ] Register creates user in database
- [ ] Login returns valid JWT token
- [ ] Protected routes require valid token
- [ ] Token stored in localStorage persists across page refresh
- [ ] Logout clears token and redirects to login
- [ ] Expired token triggers logout (simulate by editing expiry in JWT)
- [ ] File upload sends multipart/form-data correctly
- [ ] SHA-256 hash computed on backend matches test hash
- [ ] Document metadata stored in PostgreSQL
- [ ] File stored in MinIO/S3
- [ ] Ledger entry created automatically on upload
- [ ] Ledger timeline fetches and displays entries
- [ ] Hash verification re-downloads file from S3
- [ ] Hash verification creates VERIFIED ledger entry
- [ ] Role-based queries work (corporate sees own, auditor sees all)

---

## 9. Troubleshooting Guide

### Issue: Backend won't start

**Error:** `ImportError: No module named 'fastapi'`

**Solution:**
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

---

### Issue: Database connection failed

**Error:** `sqlalchemy.exc.OperationalError: could not connect to server`

**Solution:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Or start Docker container
docker ps -a | grep postgres
docker start postgres-trade-finance

# Verify DATABASE_URL in .env
echo $DATABASE_URL
```

---

### Issue: Alembic migration fails

**Error:** `alembic.util.exc.CommandError: Can't locate revision identified by 'head'`

**Solution:**
```bash
# Reset Alembic
rm -rf alembic/versions/*
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head
```

---

### Issue: S3 upload fails

**Error:** `botocore.exceptions.EndpointConnectionError: Could not connect to the endpoint URL`

**Solution:**
```bash
# Check MinIO is running
docker ps | grep minio
docker start minio-trade-finance

# Verify bucket exists
# Navigate to http://localhost:9001
# Login: minioadmin / minioadmin
# Create bucket: trade-finance-documents

# Check S3_ENDPOINT_URL in .env
echo $S3_ENDPOINT_URL  # Should be http://localhost:9000
```

---

### Issue: Frontend CORS error

**Error:** `Access to XMLHttpRequest at 'http://localhost:8000' has been blocked by CORS policy`

**Solution:**
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Add frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Issue: JWT token invalid

**Error:** `401 Unauthorized: Invalid authentication credentials`

**Solution:**
```bash
# Check SECRET_KEY matches between login and verification
# Regenerate token:
# 1. Logout (clear localStorage)
# 2. Login again
# 3. Check token in DevTools → Application → Local Storage
```

---

### Issue: File upload returns 413 Payload Too Large

**Solution:**
```python
# backend/app/main.py
from fastapi import FastAPI
app = FastAPI()

# Add before routes
app.add_middleware(
    MaxSizeMiddleware,
    max_size=50 * 1024 * 1024  # 50 MB
)

# Or configure Nginx if using reverse proxy
```

---

### Issue: Ledger timeline empty

**Solution:**
```sql
-- Check database
SELECT * FROM ledger_entries WHERE document_id = 1;

-- If empty, ledger entry creation failed
-- Check backend logs for errors during document upload
```

---

## 10. Success Criteria for Phase 5

Phase 5 (Implementation & Integration) is complete when:

1. **Backend is fully functional**
   - All models created via Alembic migrations
   - All API endpoints respond correctly
   - JWT authentication works
   - Role-based access control enforced
   - File upload to S3 works
   - SHA-256 hashing works
   - Ledger entries created automatically
   - Hash verification works

2. **Frontend is fully functional**
   - All pages render without errors
   - Login/register forms work
   - JWT token stored and attached to requests
   - Protected routes redirect correctly
   - Document list displays data from backend
   - Document upload form sends data correctly
   - Ledger timeline displays entries
   - Hash verification button triggers API call

3. **Integration works end-to-end**
   - Can register user via UI → user created in DB
   - Can login via UI → JWT returned and stored
   - Can upload document via UI → file in S3, metadata in DB, ledger entry created
   - Can verify hash via UI → S3 file re-downloaded, hash compared, VERIFIED entry created
   - Auditor can see all documents (backend enforces role-based queries)
   - Corporate user can only see own documents

4. **Demo scenario completed successfully**
   - All 9 steps executed without errors
   - Ledger shows both ISSUED and VERIFIED entries
   - Hash verification returns "✅ Valid"

5. **Code quality meets standards**
   - No hardcoded secrets (use .env)
   - No console errors in browser
   - Backend follows Phase 3 design exactly
   - Frontend follows Phase 4 design exactly
   - README files exist with setup instructions

**Sign-off Required:**
- [ ] Technical lead code review
- [ ] Demo walkthrough completed with mentor
- [ ] All success criteria checked
- [ ] Ready for Phase 6 (Deployment)

---

**Next Phase:** Phase 6 – Deployment & Production Readiness (Docker, CI/CD, monitoring)
