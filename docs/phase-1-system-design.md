
# Trade Finance Blockchain Explorer
## Phase 1 – System Design (Agile-Aligned)


## 1. Project Overview

The **Trade Finance Blockchain Explorer** is a web-based platform for tracking trade finance documents (Letters of Credit, invoices, bills of lading, etc.) with transparent, tamper-evident audit trails.

**Key Point:** This is a **ledger-based system**, not a real blockchain. It uses cryptographic hashing (SHA-256) and append-only logging to simulate blockchain properties (immutability, transparency) without distributed consensus.

**Primary Use Cases:**
- Banks and corporates upload trade documents
- System generates tamper-proof hashes
- Every action is logged in an immutable ledger
- Auditors verify document integrity and transaction history
- Admins monitor system health and user activities

**Target Audience:** Financial institutions, exporters, importers, auditors, and regulators.

---

## 2. Architecture Overview

### Backend-First Philosophy
All business logic, security, and data validation reside in the **FastAPI backend**. 

The frontend (React) is a thin client that:
- Displays data
- Captures user input
- Sends authenticated API requests

The backend:
- Enforces role-based access control
- Computes document hashes (server-side only)
- Manages database transactions
- Handles file storage (S3)
- Runs background integrity checks

### High-Level Component Breakdown

```
┌──────────────────────────────────────────────────────────┐
│                    REACT FRONTEND                        │
│         (Tailwind CSS, Role-based routing)               │
└─────────────────────┬────────────────────────────────────┘
                      │ REST API + JWT
┌─────────────────────▼────────────────────────────────────┐
│                  FASTAPI BACKEND                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │  API Layer (Routers)                               │  │
│  │  /auth  /documents  /ledger  /trades  /analytics   │  │
│  └──────────────────┬─────────────────────────────────┘  │
│  ┌──────────────────▼─────────────────────────────────┐  │
│  │  Business Logic (Services)                         │  │
│  │  AuthService | DocumentService | LedgerService     │  │
│  └──────────────────┬─────────────────────────────────┘  │
│  ┌──────────────────▼─────────────────────────────────┐  │
│  │  Data Access (SQLAlchemy Models)                   │  │
│  └──────────────────┬─────────────────────────────────┘  │
└─────────────────────┼────────────────────────────────────┘
                      │
       ┌──────────────┼──────────────┬──────────────┐
       │              │              │              │
┌──────▼─────┐  ┌────▼─────┐  ┌────▼────┐  ┌─────▼──────┐
│ PostgreSQL │  │ S3/Object│  │ Celery  │  │  External  │
│  Database  │  │ Storage  │  │ Worker  │  │  Mock APIs │
└────────────┘  └──────────┘  └─────────┘  └────────────┘
```

### Key Components
- **PostgreSQL**: Stores all metadata (users, documents, ledger entries, trades)
- **S3 Storage**: Stores actual document files (PDFs, images)
- **JWT Auth**: Stateless authentication with role/org embedded in token
- **Celery Worker**: Background jobs for periodic integrity checks (Week 6+)
- **External APIs**: Mock UNCTAD/WTO data for risk scoring (Week 7+)

---

## 3. Core Design Principles

### 1. Backend-Controlled Logic
- All hash computations happen server-side (trusted source)
- Frontend never sees S3 credentials
- Validation enforced at API layer, not just UI

### 2. Role-Based Access Control (RBAC)
- Every API endpoint checks user role
- Four roles: `bank`, `corporate`, `auditor`, `admin`
- Organization scoping: users only see their org's data (except auditors/admins)

### 3. Append-Only Ledger
- Ledger entries are **never deleted or updated**
- Every document action creates a new ledger entry
- Timestamps are immutable (database constraint)

### 4. Separation of Concerns
- **Documents table**: Static metadata + hash
- **LedgerEntries table**: Temporal events (who, what, when)
- **TradeTransactions table**: Business transactions
- Each table has a single, clear responsibility

### 5. Tamper Detection
- SHA-256 hash computed on upload
- Periodic background job re-computes hash from S3 file
- Mismatch = integrity violation → alert admin

---

## 4. Roles & Permissions (Summary)

| Role        | Upload Docs | View Own Docs | View All Docs | Create Trades | View All Trades | View Risk Scores | Manage Users |
|-------------|-------------|---------------|---------------|---------------|-----------------|------------------|--------------|
| **bank**    | ✅          | ✅            | ❌            | ✅            | ❌              | ✅ (all)         | ❌           |
| **corporate** | ✅        | ✅            | ❌            | ✅            | ❌              | ✅ (own)         | ❌           |
| **auditor** | ❌          | ❌            | ✅            | ❌            | ✅              | ✅ (all)         | ❌           |
| **admin**   | ✅          | ✅            | ✅            | ✅            | ✅              | ✅ (all)         | ✅           |

**Key Patterns:**
- **Write access**: banks, corporates, admins
- **Read-only access**: auditors (full visibility, no mutations)
- **Superuser**: admin (all operations + system management)

---

## 5. Module Breakdown (A–E)

### Module A: Authentication & Role/Org Management

**Purpose:** Secure user authentication and role-based authorization.

**Responsibilities:**
- User registration (name, email, password, role, org_name)
- Login (email + password → JWT tokens)
- Token validation middleware
- Role checking decorators

**Dependencies:** None (foundation module)

**Output:**
- JWT access token (short-lived, 15 min)
- JWT refresh token (long-lived, 7 days) — **Week 3+ enhancement**
- User context available to all downstream modules

---

### Module B: Document Upload, Hash & Storage

**Purpose:** Store trade finance documents with cryptographic verification.

**Responsibilities:**
- Accept file uploads (PDF, images)
- Compute SHA-256 hash (server-side)
- Upload file to S3
- Store metadata in `Documents` table
- Create initial ledger entry (action: ISSUED)

**Dependencies:**
- Module A (auth required to upload)

**Output:**
- Document record with `{id, hash, file_url, owner_id}`
- Initial ledger entry

**Document Types Supported:**
- LOC (Letter of Credit)
- INVOICE
- BILL_OF_LADING
- PO (Purchase Order)
- COO (Certificate of Origin)
- INSURANCE_CERT

---

### Module C: Ledger Explorer & Verification

**Purpose:** Immutable audit trail for document lifecycle.

**Responsibilities:**
- Append-only ledger entries
- Timeline view (chronological events per document)
- Hash verification (re-compute from S3, compare with stored hash)
- Ledger actions: ISSUED, AMENDED, SHIPPED, RECEIVED, PAID, CANCELLED, VERIFIED

**Dependencies:**
- Module B (ledger tracks document events)

**Output:**
- Ledger entries: `{document_id, action, actor_id, timestamp, metadata}`
- Verification status (✅ Valid / ❌ Tampered)

**UI View:**
- Timeline per document
- Each entry shows: timestamp, action, user who performed action

---

### Module D: Trade Transactions & Risk Score

**Purpose:** Track buyer-seller transactions and assess counterparty risk.

**Responsibilities:**
- Create trade transactions (buyer, seller, amount, currency)
- Update trade status (pending → in_progress → completed → disputed)
- Calculate risk scores per user (0-100 scale)
- Store rationale text explaining risk score

**Risk Scoring Logic (Simple):**
- Internal factors: trade completion rate, dispute rate, transaction volume
- External factors: mock UNCTAD/WTO country/sector risk data
- **Week 7+ implementation** — Week 5 uses placeholder scores

**Dependencies:**
- Module A (auth required)
- Module C (trade status changes logged in ledger)

**Output:**
- Trade records: `{buyer_id, seller_id, amount, status}`
- Risk scores: `{user_id, score, rationale, last_updated}`

---

### Module E: Analytics & Reporting

**Purpose:** Business intelligence dashboards and compliance reports.

**Responsibilities:**
- Aggregate statistics (total docs, trades, avg risk)
- Time-series charts (uploads over time, trade volume)
- Export reports (CSV for data, PDF for formatted reports)
- Role-based dashboards (users see own data, auditors see all)

**Dependencies:**
- All modules (read-only aggregation)

**Output:**
- Dashboard KPIs
- Exportable CSV/PDF reports

**Key Metrics:**
- Total documents uploaded
- Total trade transactions
- Average risk score
- Documents by type (pie chart)
- Trades by status (bar chart)

---

## 6. End-to-End Flow Example

**Scenario:** Corporate uploads an invoice, bank verifies it, trade is completed.

```
1. Corporate logs in (Module A)
   → Receives JWT token {user_id: 5, role: 'corporate', org: 'ACME Corp'}

2. Corporate uploads invoice PDF (Module B)
   → Backend computes SHA-256 hash: "abc123..."
   → File uploaded to S3: s3://bucket/invoices/abc123.pdf
   → Documents table: {id: 10, owner_id: 5, hash: "abc123...", ...}
   → Ledger entry created (Module C): {doc_id: 10, action: ISSUED, actor_id: 5}

3. Bank views document (Module B + C)
   → Fetches document metadata
   → Views ledger timeline (1 entry: ISSUED by Corporate)

4. Bank verifies document (Module C)
   → Backend re-computes hash from S3 file
   → Compares with stored hash → ✅ Match
   → Ledger entry created: {doc_id: 10, action: VERIFIED, actor_id: 3}

5. Corporate creates trade transaction (Module D)
   → {buyer_id: 5, seller_id: 8, amount: 50000, status: pending}
   → Ledger entry: {action: TRADE_CREATED, metadata: {trade_id: 15}}

6. Trade status updated to completed (Module D)
   → Status changed: pending → completed
   → Ledger entry: {action: TRADE_COMPLETED, metadata: {trade_id: 15}}

7. Auditor views analytics (Module E)
   → Dashboard shows: 1 invoice, 1 trade completed, avg risk score: 45
   → Exports CSV report for compliance audit
```

---

## 7. Agile Scope Control

| Feature / Component                  | Sprint / Week | Implement Now | Reason                                      |
|--------------------------------------|---------------|---------------|---------------------------------------------|
| User registration & login (JWT)      | Week 1        | **YES**       | Core foundation, required for all modules   |
| Refresh token rotation               | Week 3+       | **NO**        | Enhancement, access token sufficient for MVP|
| Document upload (SHA-256 hash)       | Week 3        | **YES**       | Core feature, must work end-to-end          |
| S3 file storage                      | Week 3        | **YES**       | Required for scalable document storage      |
| Ledger entry creation                | Week 4        | **YES**       | Core audit trail feature                    |
| Ledger explorer UI (timeline)        | Week 4        | **YES**       | Must visualize ledger for users             |
| Hash verification (manual trigger)   | Week 4        | **YES**       | Critical for tamper detection               |
| Celery background worker             | Week 6        | **PARTIAL**   | Simulate first, implement worker later      |
| Automated integrity checks           | Week 6        | **PARTIAL**   | Manual trigger first, automate later        |
| Trade transaction creation           | Week 5        | **YES**       | Core business logic                         |
| Trade status updates                 | Week 5        | **YES**       | Required for trade lifecycle                |
| Risk score calculation               | Week 7        | **PARTIAL**   | Use mock/placeholder logic first            |
| Real UNCTAD/WTO API integration      | Week 8+       | **NO**        | Use mock data, defer real API               |
| CSV export                           | Week 8        | **YES**       | Simple, high-value for users                |
| PDF report generation                | Week 8        | **PARTIAL**   | Basic version only, defer complex formatting|
| Audit logs (admin actions)           | Week 2        | **YES**       | Required for compliance                     |
| Organization-based data scoping      | Week 2        | **YES**       | Required for multi-tenant isolation         |
| Email notifications                  | Post-Week 8   | **NO**        | Deferred, not in PDF spec                   |
| Two-factor authentication (2FA)      | Post-Week 8   | **NO**        | Enhancement, not required for MVP           |

---

## 8. What We WILL Implement First (MVP: Weeks 1–4)

**Week 1–2: Authentication & Foundation**
- User registration (name, email, password, role, org_name)
- Login endpoint (returns JWT access token)
- JWT validation middleware
- Role-based route protection
- Audit logs for admin actions
- Basic React frontend (login/register pages)

**Week 3: Document Upload**
- File upload API (multipart/form-data)
- SHA-256 hash computation (server-side)
- S3 file storage integration
- Documents table CRUD
- Initial ledger entry creation (ISSUED action)
- Document list UI (role-scoped)

**Week 4: Ledger Explorer**
- Ledger entry API (create, list by document)
- Timeline UI (chronological view per document)
- Hash verification endpoint (manual trigger)
- Verification result display (✅ Valid / ❌ Tampered)

**MVP Success Criteria:**
- Users can register, login, and receive JWT token
- Users can upload documents (PDF/image)
- Each document has a SHA-256 hash stored
- Ledger shows ISSUED and VERIFIED actions
- Hash verification works (detect tampering)
- Role-based access enforced (corporate can't see all docs)

---

## 9. What We Will SKIP or SIMULATE Initially

**Deferred for Later Sprints (Weeks 5+):**

1. **Refresh Token Rotation**
   - Why: Access tokens (15 min expiry) sufficient for MVP
   - When: Week 3+ enhancement

2. **Celery Background Worker**
   - Why: Can simulate integrity checks with manual API trigger first
   - When: Week 6 (after core features stable)

3. **Real External APIs (UNCTAD/WTO)**
   - Why: Mock data sufficient for risk scoring logic proof-of-concept
   - When: Week 8+ or post-launch

4. **Advanced PDF Report Formatting**
   - Why: Basic CSV export covers 80% of use cases
   - When: Week 8 (simple PDF only, complex formatting deferred)

5. **Email Notifications**
   - Why: Not in original PDF spec, adds complexity
   - When: Post-Week 8 if requested

6. **Two-Factor Authentication (2FA)**
   - Why: Not required for MVP, adds significant scope
   - When: Post-launch enhancement

7. **Document Versioning**
   - Why: AMENDED action in ledger sufficient for MVP
   - When: Week 6+ if needed

8. **Advanced Analytics (ML-based forecasting)**
   - Why: Simple aggregations sufficient for MVP
   - When: Post-launch if requested

**Simulated Initially:**
- **Risk Scores**: Use placeholder formula (e.g., `score = 50 + random(-10, 10)`) in Week 5, replace with real logic in Week 7
- **Integrity Checks**: Manual API trigger in Week 4, automate with Celery in Week 6
- **External Data**: Use static JSON mock data instead of live API calls


---
**Next Phase:** Phase 2 – Database Design (PostgreSQL schema, indexes, constraints)
