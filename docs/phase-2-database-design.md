# Trade Finance Blockchain Explorer
## Phase 2 – Database Design

---

## 1. Database Overview

**Database Management System:** PostgreSQL 14+

**Why PostgreSQL?**
- ACID compliance (critical for financial data)
- JSONB support (flexible metadata in ledger entries)
- Strong foreign key constraints (data integrity)
- Excellent performance for read-heavy workloads
- Industry-standard for fintech applications

**Design Principles:**
- Normalize to 3NF (avoid data duplication)
- Use foreign keys to enforce referential integrity
- Timestamps on all tables (audit trail)
- Enums for controlled vocabularies (roles, statuses)
- Indexes only where query patterns demand them

---

## 2. Schema Overview

**6 Core Tables (from PDF):**

1. **Users** – Identity and access control
2. **Documents** – Trade finance documents metadata
3. **LedgerEntries** – Immutable audit trail for documents
4. **TradeTransactions** – Buyer-seller transactions
5. **RiskScores** – Counterparty risk assessments
6. **AuditLogs** – Admin action tracking

**Entity Relationships:**
```
Users (1) ──────< (N) Documents
  │                      │
  │                      │
  │                      └──< (N) LedgerEntries
  │
  ├──< (N) TradeTransactions (as buyer)
  │
  ├──< (N) TradeTransactions (as seller)
  │
  ├──< (1) RiskScores
  │
  └──< (N) AuditLogs (as admin)
```

---

## 3. Table Definitions

### 3.1 Users Table

**Purpose:** Central identity table for all system users.

```sql
CREATE TYPE user_role AS ENUM ('bank', 'corporate', 'auditor', 'admin');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,  -- Hashed (bcrypt/argon2)
    role user_role NOT NULL,
    org_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Column Details:**

| Column      | Type          | Constraints          | Purpose                          |
|-------------|---------------|----------------------|----------------------------------|
| id          | SERIAL        | PRIMARY KEY          | Unique user identifier           |
| name        | VARCHAR(255)  | NOT NULL             | Full name                        |
| email       | VARCHAR(255)  | NOT NULL, UNIQUE     | Login identifier                 |
| password    | VARCHAR(255)  | NOT NULL             | Hashed password (never plaintext)|
| role        | user_role     | NOT NULL             | Access control level             |
| org_name    | VARCHAR(255)  | NOT NULL             | Organization for data scoping    |
| created_at  | TIMESTAMP     | NOT NULL, DEFAULT    | Account creation time            |

**Indexes:**
```sql
CREATE INDEX idx_users_email ON users(email);  -- Login lookups
CREATE INDEX idx_users_org_name ON users(org_name);  -- Org-scoped queries
```

**MVP Status:** ✅ **Week 1** (foundation for all features)

**Design Notes:**
- `email` is unique (one account per email)
- `password` must be hashed before storage (bcrypt with salt)
- `org_name` is stored denormalized (simpler than separate Orgs table for MVP)
- `role` enum prevents invalid role values

---

### 3.2 Documents Table

**Purpose:** Metadata for uploaded trade finance documents.

```sql
CREATE TYPE document_type AS ENUM (
    'LOC',              -- Letter of Credit
    'INVOICE',          -- Commercial Invoice
    'BILL_OF_LADING',   -- Shipping document
    'PO',               -- Purchase Order
    'COO',              -- Certificate of Origin
    'INSURANCE_CERT'    -- Insurance Certificate
);

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doc_type document_type NOT NULL,
    doc_number VARCHAR(100) NOT NULL,
    file_url VARCHAR(500) NOT NULL,  -- S3 path
    hash VARCHAR(64) NOT NULL,       -- SHA-256 (64 hex chars)
    issued_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Column Details:**

| Column      | Type            | Constraints              | Purpose                          |
|-------------|-----------------|--------------------------|----------------------------------|
| id          | SERIAL          | PRIMARY KEY              | Unique document identifier       |
| owner_id    | INTEGER         | NOT NULL, FK → users(id) | Document owner (uploader)        |
| doc_type    | document_type   | NOT NULL                 | Document category                |
| doc_number  | VARCHAR(100)    | NOT NULL                 | Business identifier (e.g., LOC#) |
| file_url    | VARCHAR(500)    | NOT NULL                 | S3 object path                   |
| hash        | VARCHAR(64)     | NOT NULL                 | SHA-256 checksum (hex string)    |
| issued_at   | TIMESTAMP       | NOT NULL                 | Business issuance date           |
| created_at  | TIMESTAMP       | NOT NULL, DEFAULT        | System upload time               |

**Indexes:**
```sql
CREATE INDEX idx_documents_owner_id ON documents(owner_id);  -- User's documents
CREATE INDEX idx_documents_doc_type ON documents(doc_type);  -- Filter by type
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);  -- Recent docs
```

**MVP Status:** ✅ **Week 3** (core document management)

**Design Notes:**
- `owner_id` foreign key ensures users can't be deleted if they own documents
- `hash` is 64 characters (SHA-256 hex representation)
- `file_url` stores S3 path, not full URL (backend generates pre-signed URLs)
- `doc_number` is business-facing identifier (not enforced unique, can have duplicates across orgs)

---

### 3.3 LedgerEntries Table

**Purpose:** Immutable audit trail for document lifecycle events.

```sql
CREATE TYPE ledger_action AS ENUM (
    'ISSUED',
    'AMENDED',
    'SHIPPED',
    'RECEIVED',
    'PAID',
    'CANCELLED',
    'VERIFIED'
);

CREATE TABLE ledger_entries (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    action ledger_action NOT NULL,
    actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB,  -- Flexible additional data
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Column Details:**

| Column      | Type           | Constraints                | Purpose                          |
|-------------|----------------|----------------------------|----------------------------------|
| id          | SERIAL         | PRIMARY KEY                | Unique ledger entry identifier   |
| document_id | INTEGER        | NOT NULL, FK → documents   | Document this event relates to   |
| action      | ledger_action  | NOT NULL                   | Type of event                    |
| actor_id    | INTEGER        | NOT NULL, FK → users       | User who performed action        |
| metadata    | JSONB          | NULL                       | Flexible event-specific data     |
| created_at  | TIMESTAMP      | NOT NULL, DEFAULT          | Immutable timestamp              |

**Indexes:**
```sql
CREATE INDEX idx_ledger_document_id ON ledger_entries(document_id);  -- Doc history
CREATE INDEX idx_ledger_created_at ON ledger_entries(created_at DESC);  -- Timeline
```

**MVP Status:** ✅ **Week 4** (audit trail for documents)

**Design Notes:**
- **Append-only**: No UPDATE or DELETE operations in application code
- `created_at` is immutable (database-level timestamp, not application-provided)
- `metadata` JSONB allows flexible storage (e.g., `{"previous_hash": "abc", "reason": "typo"}`)
- `actor_id` uses `ON DELETE SET NULL` (keep ledger even if user deleted)
- Every document upload automatically creates an `ISSUED` entry

---

### 3.4 TradeTransactions Table

**Purpose:** Buyer-seller trade lifecycle tracking.

```sql
CREATE TYPE trade_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'disputed'
);

CREATE TABLE trade_transactions (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL,  -- Up to 999,999,999,999.99
    currency CHAR(3) NOT NULL,       -- ISO 4217 (USD, EUR, etc.)
    status trade_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Column Details:**

| Column      | Type          | Constraints                | Purpose                          |
|-------------|---------------|----------------------------|----------------------------------|
| id          | SERIAL        | PRIMARY KEY                | Unique trade identifier          |
| buyer_id    | INTEGER       | NOT NULL, FK → users       | Purchasing party                 |
| seller_id   | INTEGER       | NOT NULL, FK → users       | Selling party                    |
| amount      | NUMERIC(15,2) | NOT NULL                   | Transaction value                |
| currency    | CHAR(3)       | NOT NULL                   | ISO currency code                |
| status      | trade_status  | NOT NULL, DEFAULT          | Current trade state              |
| created_at  | TIMESTAMP     | NOT NULL, DEFAULT          | Trade initiation time            |
| updated_at  | TIMESTAMP     | NOT NULL, DEFAULT          | Last status change time          |

**Indexes:**
```sql
CREATE INDEX idx_trades_buyer_id ON trade_transactions(buyer_id);  -- Buyer's trades
CREATE INDEX idx_trades_seller_id ON trade_transactions(seller_id);  -- Seller's trades
CREATE INDEX idx_trades_status ON trade_transactions(status);  -- Filter by status
```

**MVP Status:** ✅ **Week 5** (core business logic)

**Design Notes:**
- `amount` uses NUMERIC for precision (avoid floating-point errors in financial calculations)
- `currency` is 3-character ISO 4217 code (not enforced by constraint, validated in application)
- `updated_at` should be updated via trigger or application logic on status change
- Future enhancement: Add `trade_documents` join table to link trades with documents

**Trigger for updated_at:**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trade_updated_at BEFORE UPDATE ON trade_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### 3.5 RiskScores Table

**Purpose:** Store calculated risk assessments per user.

```sql
CREATE TABLE risk_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) NOT NULL CHECK (score >= 0 AND score <= 100),  -- 0.00 to 100.00
    rationale TEXT NOT NULL,  -- Human-readable explanation
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)  -- One current score per user
);
```

**Column Details:**

| Column       | Type          | Constraints                | Purpose                          |
|--------------|---------------|----------------------------|----------------------------------|
| id           | SERIAL        | PRIMARY KEY                | Unique score record identifier   |
| user_id      | INTEGER       | NOT NULL, FK → users, UNIQUE | User being scored              |
| score        | NUMERIC(5,2)  | NOT NULL, CHECK (0-100)    | Risk level (0=low, 100=high)     |
| rationale    | TEXT          | NOT NULL                   | Explanation of score             |
| last_updated | TIMESTAMP     | NOT NULL, DEFAULT          | Calculation timestamp            |

**Indexes:**
```sql
CREATE INDEX idx_risk_user_id ON risk_scores(user_id);  -- Lookup by user
CREATE INDEX idx_risk_score ON risk_scores(score DESC);  -- Sort by risk level
```

**MVP Status:** ⚠️ **Week 7** (deferred, use placeholder data in Week 5)

**Design Notes:**
- `UNIQUE(user_id)` ensures one current score per user (replace on update, not append)
- `score` range enforced at database level (0-100)
- `rationale` stores explanation (e.g., "Low dispute rate (2%), high trade volume, stable country")
- Future: Add `version` column for historical risk scores

---

### 3.6 AuditLogs Table

**Purpose:** Track admin actions for compliance.

```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,  -- Human-readable description
    target_type VARCHAR(50),  -- e.g., 'User', 'Document', 'Trade'
    target_id INTEGER,  -- ID of affected entity
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Column Details:**

| Column      | Type         | Constraints              | Purpose                          |
|-------------|--------------|--------------------------|----------------------------------|
| id          | SERIAL       | PRIMARY KEY              | Unique log entry identifier      |
| admin_id    | INTEGER      | NOT NULL, FK → users     | Admin who performed action       |
| action      | TEXT         | NOT NULL                 | Description of action taken      |
| target_type | VARCHAR(50)  | NULL                     | Entity type affected             |
| target_id   | INTEGER      | NULL                     | Entity ID affected               |
| timestamp   | TIMESTAMP    | NOT NULL, DEFAULT        | When action occurred             |

**Indexes:**
```sql
CREATE INDEX idx_audit_admin_id ON audit_logs(admin_id);  -- Admin's actions
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);  -- Recent actions
CREATE INDEX idx_audit_target ON audit_logs(target_type, target_id);  -- Entity history
```

**MVP Status:** ✅ **Week 2** (required for compliance from day 1)

**Design Notes:**
- `admin_id` uses `ON DELETE SET NULL` (keep logs even if admin deleted)
- `action` examples: "Deleted user ID 123", "Reset password for user@example.com"
- `target_type` and `target_id` allow polymorphic references (not enforced by FK)
- All admin mutations should create an audit log entry

---

## 4. Foreign Key Relationships (Summary)

```sql
-- Documents
ALTER TABLE documents 
    ADD CONSTRAINT fk_documents_owner 
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

-- LedgerEntries
ALTER TABLE ledger_entries 
    ADD CONSTRAINT fk_ledger_document 
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;

ALTER TABLE ledger_entries 
    ADD CONSTRAINT fk_ledger_actor 
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL;

-- TradeTransactions
ALTER TABLE trade_transactions 
    ADD CONSTRAINT fk_trade_buyer 
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE trade_transactions 
    ADD CONSTRAINT fk_trade_seller 
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE;

-- RiskScores
ALTER TABLE risk_scores 
    ADD CONSTRAINT fk_risk_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- AuditLogs
ALTER TABLE audit_logs 
    ADD CONSTRAINT fk_audit_admin 
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL;
```

**Cascade Behavior:**
- **CASCADE**: Delete related records (documents, trades, risks when user deleted)
- **SET NULL**: Preserve record but nullify reference (ledger entries, audit logs)

---

## 5. MVP vs Later Implementation

### Week 1–2: Foundation Tables
✅ **Implement Now:**
- `users` table (complete)
- `audit_logs` table (complete)

### Week 3–4: Core Features
✅ **Implement Now:**
- `documents` table (complete)
- `ledger_entries` table (complete)

### Week 5: Business Logic
✅ **Implement Now:**
- `trade_transactions` table (complete)

### Week 7+: Advanced Features
⚠️ **Defer:**
- `risk_scores` table (schema ready, populate with placeholders in Week 5, real logic in Week 7)

---

## 6. What to Avoid (Over-Engineering)

### ❌ Don't Add These Tables (Not in PDF):
- `organizations` table (use `org_name` string in users for MVP)
- `trade_documents` join table (defer until linking trades-docs is needed)
- `document_versions` table (use AMENDED ledger action for MVP)
- `notifications` table (not in spec)
- `sessions` table (JWT is stateless)

### ❌ Don't Add These Columns:
- Soft delete flags (`is_deleted`, `deleted_at`) — use audit logs instead
- Complex metadata (`risk_factors JSONB` in users) — keep simple
- Premature optimizations (`calculated_risk_score` in users) — use separate table

### ❌ Don't Add These Indexes (Yet):
- Full-text search indexes on `documents.doc_number` — wait for search feature request
- Composite indexes on `(org_name, role)` in users — profile first, optimize later
- GIN indexes on `metadata` JSONB — add when query patterns emerge

### ✅ Do This Instead:
- Start with minimal indexes (primary keys + foreign keys)
- Add indexes based on slow query log analysis (Week 6+)
- Use `EXPLAIN ANALYZE` to validate index effectiveness

---

## 7. Database Initialization Script

**File:** `backend/db/init.sql`

```sql
-- Create enums
CREATE TYPE user_role AS ENUM ('bank', 'corporate', 'auditor', 'admin');
CREATE TYPE document_type AS ENUM ('LOC', 'INVOICE', 'BILL_OF_LADING', 'PO', 'COO', 'INSURANCE_CERT');
CREATE TYPE ledger_action AS ENUM ('ISSUED', 'AMENDED', 'SHIPPED', 'RECEIVED', 'PAID', 'CANCELLED', 'VERIFIED');
CREATE TYPE trade_status AS ENUM ('pending', 'in_progress', 'completed', 'disputed');

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    org_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doc_type document_type NOT NULL,
    doc_number VARCHAR(100) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    hash VARCHAR(64) NOT NULL,
    issued_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- LedgerEntries table
CREATE TABLE ledger_entries (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    action ledger_action NOT NULL,
    actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- TradeTransactions table
CREATE TABLE trade_transactions (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL,
    currency CHAR(3) NOT NULL,
    status trade_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RiskScores table
CREATE TABLE risk_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) NOT NULL CHECK (score >= 0 AND score <= 100),
    rationale TEXT NOT NULL,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- AuditLogs table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type VARCHAR(50),
    target_id INTEGER,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_org_name ON users(org_name);
CREATE INDEX idx_documents_owner_id ON documents(owner_id);
CREATE INDEX idx_documents_doc_type ON documents(doc_type);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_ledger_document_id ON ledger_entries(document_id);
CREATE INDEX idx_ledger_created_at ON ledger_entries(created_at DESC);
CREATE INDEX idx_trades_buyer_id ON trade_transactions(buyer_id);
CREATE INDEX idx_trades_seller_id ON trade_transactions(seller_id);
CREATE INDEX idx_trades_status ON trade_transactions(status);
CREATE INDEX idx_risk_user_id ON risk_scores(user_id);
CREATE INDEX idx_risk_score ON risk_scores(score DESC);
CREATE INDEX idx_audit_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_target ON audit_logs(target_type, target_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trade_updated_at BEFORE UPDATE ON trade_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 8. Database Connection Configuration

**Environment Variables (`.env`):**

```bash
# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/trade_finance
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10
DATABASE_POOL_TIMEOUT=30
```

**SQLAlchemy Connection (FastAPI):**

```python
# backend/db/session.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_timeout=30,
    pool_pre_ping=True  # Verify connections before using
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

---

## 9. Data Integrity Constraints (Summary)

| Constraint Type   | Implementation                          | Purpose                          |
|-------------------|-----------------------------------------|----------------------------------|
| Primary Keys      | `id SERIAL PRIMARY KEY` on all tables   | Unique record identification     |
| Foreign Keys      | `REFERENCES table(id)`                  | Referential integrity            |
| Unique            | `email` in users, `user_id` in risk_scores | Prevent duplicates            |
| NOT NULL          | All required business fields            | Data completeness                |
| CHECK             | `score` range (0-100) in risk_scores    | Domain validation                |
| ENUM              | `role`, `doc_type`, `action`, `status`  | Controlled vocabularies          |
| Timestamps        | `DEFAULT CURRENT_TIMESTAMP`             | Audit trail                      |

---


**Next Phase:** Phase 3 – Backend Implementation (FastAPI project structure, models, authentication)
