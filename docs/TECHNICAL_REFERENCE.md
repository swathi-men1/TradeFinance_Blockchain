# Technical Reference — Trade Finance Blockchain Explorer

This document is the single authoritative technical reference for the system. It consolidates the system overview, architecture deep-dive, business logic algorithms, security design, and viva Q&A into one clean document for developers, reviewers, and evaluators.

---

## 1. System Overview

### The Problem
Traditional international trade finance relies on siloed, paper-based documents (Bills of Lading, Letters of Credit). This introduces:
- **Document Forgery** — Invoices and shipping documents are tampered with to secure fraudulent financing.
- **Double Financing** — The same document is pledged as collateral to multiple banks simultaneously.
- **Risk Blindness** — Banks lack real-time, quantitative insight into counterparty creditworthiness.
- **Compliance Burden** — Auditing requires months of manual log reconstruction.

### The Solution
The Trade Finance Blockchain Explorer creates a **zero-trust, mathematically verifiable environment** by combining:
1. A **blockchain-inspired append-only ledger** with cryptographic hash chaining for immutable audit trails.
2. **SHA-256 document fingerprinting** at the exact moment of upload for tamper detection.
3. **Strict Role-Based Access Control (RBAC)** enforced at the API level.
4. An **automated rule-based risk scoring engine** for transparent counterparty profiling.

---

## 2. System Architecture

The application follows a modern, decoupled client-server architecture.

```
React SPA (TypeScript + Vite)
     │  Axios HTTP + JWT Bearer Token
     ▼
FastAPI (Python/ASGI)
     │  SQLAlchemy ORM    │  Boto3 S3 Client
     ▼                    ▼
PostgreSQL              MinIO / Supabase Storage
(Relational Data)       (Binary Documents)
```

### Request Lifecycle
1. The React UI dispatches an Axios HTTP request with a `Authorization: Bearer <JWT>` header.
2. FastAPI middleware decodes the JWT and cryptographically verifies its signature using the `SECRET_KEY`.
3. FastAPI dependency injection (`Depends(require_role(["bank"]))`) verifies RBAC restrictions before any controller logic runs.
4. The service layer executes business logic via SQLAlchemy (querying PostgreSQL) and Boto3 (interacting with MinIO/S3).
5. On success, the database transaction commits and a serialized JSON response is returned.

---

## 3. Technology Stack & Justification

### Backend
| Library | Role | Why Chosen |
|---|---|---|
| **FastAPI** | API Framework | Native `async/await`, automatic Swagger UI, Pydantic integration |
| **SQLAlchemy** | ORM | SQL-injection-resistant abstraction, complex join support |
| **Alembic** | Migrations | Version-controlled, incremental schema evolution |
| **PostgreSQL** | Database | ACID compliance + JSONB support for flexible ledger metadata |
| **Boto3** | S3 Client | Compatible with both local MinIO and production AWS S3/Supabase Storage |
| **JWT + bcrypt** | Auth | Stateless sessions (JWT) + salted adaptive hashing (bcrypt) |

### Frontend
| Library | Role | Why Chosen |
|---|---|---|
| **React 18 + TypeScript** | UI Framework | Type safety catches data-shape bugs at compile time, critical in financial workflows |
| **Vite** | Build Tool | Instant hot reload, far faster than Webpack |
| **Axios** | HTTP Client | Interceptors automatically attach JWTs to all outgoing requests |
| **React Router** | Routing | Client-side navigation for seamless SPA experience |

---

## 4. Database Design

### Schema Overview

| Table | Purpose |
|---|---|
| `users` | Auth, RBAC. Stores `password` (bcrypt), `role` (ENUM), `user_code`, `org_name`, `is_active`. |
| `trade_transactions` | Trade records. Links `buyer_id` + `seller_id` (FK to users). Tracks `status` and `amount`. |
| `documents` | File metadata: `filename`, `s3_key`, `hash` (SHA-256), `owner_id` (FK to users). |
| `ledger_entries` | Append-only audit chain. Stores `action` (ENUM), `actor_id`, `previous_hash`, `entry_hash`, `entry_metadata` (JSONB). |
| `risk_scores` | Cached risk state per user. Stores `score` (0-100), `category` (ENUM), textual `rationale`. |
| `compliance_alerts` | Active compliance flags. Links to the triggering document or trade. |
| `audit_logs` | Admin-specific action log, separate from the trade ledger. |

### Role Enum Values
```python
class UserRole(str, enum.Enum):
    BANK      = "bank"
    CORPORATE = "corporate"
    AUDITOR   = "auditor"
    ADMIN     = "admin"
```

---

## 5. Role-Based Access Control (RBAC)

| Role | Create Trade | Upload Doc | Verify Doc | View Ledger | Manage Users |
|---|:---:|:---:|:---:|:---:|:---:|
| **Bank** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Corporate** | ❌ | ✅ (own trades) | ❌ | ✅ (own trades) | ❌ |
| **Auditor** | ❌ | ❌ | ✅ | ✅ (global) | ❌ |
| **Admin** | ✅| ✅|✅ | ✅ | ✅ |

RBAC is enforced at two layers:
- **Backend**: FastAPI `Depends(require_role([...]))` intercepts and rejects unauthorized requests with `403 Forbidden` *before* controller logic runs.
- **Frontend**: JWT role payload conditionally renders UI components and navigation links.

---

## 6. Trade Workflow Logic

```
Bank Creates Trade
       │
       ▼
  [PENDING] ──────────────────────────────────┐
       │                                       │
 Corporate parties upload documents            │
       │                                       │
       ▼                                  [DISPUTED]
  [IN_PROGRESS]                                │
       │                                  Risk Engine
 Bank verifies docs & approves         recalculates score
       │
       ▼
  [COMPLETED]
```

**Key Constraints:**
- Status transitions are strictly validated. A `COMPLETED` trade cannot be moved backward.
- Every status change automatically creates a `LedgerEntry`.
- Only the **Bank** can create trades or advance the status.
- Any **involved party** can raise a dispute at any stage.

---

## 7. Document Verification Algorithm

This is the core fraud-prevention mechanism.

**On Upload:**
1. Backend reads the raw binary payload into memory.
2. Computes the SHA-256 hash of the binary data.
3. Streams the file to MinIO/S3 object storage.
4. Saves the `s3_key` and `sha256_hash` permanently to PostgreSQL.
5. Creates a `DOCUMENT_UPLOADED` ledger entry.

**On Verification:**
1. Backend retrieves the binary file blob from MinIO/S3.
2. Recalculates the SHA-256 hash of the freshly downloaded blob.
3. Compares the new hash against the stored database hash.
4. **If match** → Document confirmed authentic. Logs `DOCUMENT_VERIFIED`.
5. **If mismatch** → Document tampered. Logs `DOCUMENT_VERIFICATION_FAILED`, creates a critical `ComplianceAlert`, and triggers a severe risk penalty against the uploader.

---

## 8. Ledger & Hash Chain Integrity

### Structure
Each `LedgerEntry` contains:
- `action` — What happened (e.g., `DOCUMENT_UPLOADED`, `TRADE_STATUS_CHANGED`).
- `actor_id` — Who triggered it.
- `entry_metadata` — JSONB blob with context (e.g., old status, new status).
- `previous_hash` — SHA-256 hash of the *previous* ledger entry.
- `entry_hash` — SHA-256 hash of the *current* entry's content.

### Hash Formula
```
entry_hash = SHA256(action + actor_id + timestamp + JSON(metadata) + previous_hash)
```

### Tamper Detection
Because `Entry N` uses the hash of `Entry N-1` in its own calculation:
- Modifying `Entry 3`'s data changes its hash.
- The `previous_hash` stored in `Entry 4` no longer matches the re-calculated hash of `Entry 3`.
- The chain breaks **visibly and immediately**.

### Centralized vs. Distributed Blockchain
This system implements the **core integrity mechanism** (cryptographic hash chaining) of a blockchain but remains centralized. This provides:
- ✅ Enterprise-grade audit trail immutability.
- ✅ Banking-grade throughput speeds.
- ✅ Data privacy (no public distributed network).
- ❌ No decentralized consensus (intended — not needed in a controlled banking environment).

---

## 9. Risk Scoring Engine

### Formula
```
Final Score = (DI × 0.40) + (LB × 0.25) + (TB × 0.25) + (ER × 0.10)
```

### Components (Baseline = 1.0 each)

| Component | Weight | Meaning | Penalty Trigger |
|---|---|---|---|
| **DI** — Document Integrity | 40% | SHA-256 hash mismatch = fraud indicator | Document verification failure |
| **LB** — Ledger Behavior | 25% | Repeated manual amendments or workflow failures | Unusual ledger patterns |
| **TB** — Transaction Behavior | 25% | Involvement in disputes | Trade marked DISPUTED |
| **ER** — External Risk | 10% | Country/sanctions profile | Rule-based country mapping |

### Example Calculation
A corporate seller has 10 successful document uploads (DI=1.0), but their trade was recently disputed (TB drops to 0.6):
```
Score = (1.0 × 40) + (1.0 × 25) + (0.6 × 25) + (1.0 × 10)
      = 40 + 25 + 15 + 10
      = 90 → MEDIUM risk (down from LOW)
```

### Event Triggers
- `DocumentService.verify_document()` returns `False` → **Severe recalculation** (DI drops heavily).
- `TradeService.update_status()` to `DISPUTED` → **Moderate recalculation** for both buyer and seller.
- Admin bulk scan → **System-wide sweep** recalculating time-decayed variables.

> We use rule-based scoring (not ML) to ensure **full regulatory explainability**. The rationale for every score change is persisted to the database for auditor review.

---

## 10. Security Architecture

### Authentication Flow
```
Client sends {email, password}
      │
      ▼
Server hashes input with bcrypt.checkpw()
Compares against stored bcrypt hash
      │
      ▼
If valid → signs JWT: {sub: email, user_id, role, exp: +15min}
Returned to client as Bearer token
```

### RBAC Enforcement
```python
# FastAPI dependency — blocks request before any controller logic
def require_role(roles: List[str]):
    def dependency(current_user = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
    return dependency

# Applied on endpoint
@router.post("/trades")
def create_trade(deps = Depends(require_role(["bank"]))):
    ...
```

### Password Security
- **bcrypt** applies a random salt per password before hashing.
- The adaptive work factor intentionally slows computation, severely mitigating brute-force and rainbow-table attacks.

### File Access Control
- Files in MinIO/Supabase Storage are **not directly publicly accessible by URL**.
- Clients request files through the FastAPI backend, which validates RBAC before either proxying the byte stream or generating a temporary pre-signed URL.

---

## 11. Performance & Scalability

| Property | Design Decision |
|---|---|
| **Stateless Auth** | JWTs eliminate session DB lookups. Backend scales horizontally with no shared state. |
| **Async API** | FastAPI's `asyncio` means the server doesn't block while waiting for DB or S3 I/O. |
| **Pagination** | All ledger/document queries use `skip`/`limit` at the DB level to prevent memory exhaustion. |
| **DB Indexing** | Key FK columns (`owner_id`, `trade_id`, `actor_id`, `created_at`) are indexed to avoid full table scans. |
| **Service Layer** | Separating `BankService`, `LedgerService` etc. allows background workers (Celery) to call core logic without HTTP mocking. |

---

## 12. Error Handling & Validation

| Layer | Mechanism |
|---|---|
| **Input Schema** | Pydantic models enforce strict types. Sending a string to an `amount` field auto-returns `422 Unprocessable Entity`. |
| **File Validation** | Upload endpoints strictly validate `mime_type` and enforce size constraints. |
| **Business Logic Errors** | Invalid state transitions (e.g., COMPLETED → PENDING) raise `HTTPException(400)` with descriptive messages. |
| **Frontend** | Axios response interceptors catch `401 Unauthorized` and auto-redirect to logout. Toast notifications surface backend error messages. |

---

## 13. Viva Q&A Quick Reference

**Q: Why FastAPI and not Django or Flask?**
> FastAPI's native `async/await` maximizes I/O throughput for simultaneous DB and S3 calls. Django REST Framework is synchronous by default and adds unnecessary ORM complexity for a new build.

**Q: Why PostgreSQL over MongoDB?**
> Financial records require strict relational integrity (Foreign Keys, ACID transactions). PostgreSQL enforces referential consistency — a ledger entry cannot reference a non-existent trade or user.

**Q: How do JWTs prevent session hijacking?**
> JWTs are signed with `HMAC-SHA256` using the server's `SECRET_KEY`. An attacker cannot forge a valid token without knowing the private key. Token expiry (`exp: +15 minutes`) limits the damage window if one is intercepted.

**Q: Could an Admin delete ledger entries directly from the database?**
> Yes, at the raw database level. This is why the `audit_logs` table separately records all admin actions. In a full production deployment, this is mitigated with PostgreSQL Row-Level Security policies and segregated DB user permissions.

**Q: What does the APScheduler do?**
> The `scheduler.py` module runs background jobs that periodically re-verify document hashes automatically without manual Auditor intervention, maintaining continuous system health and detecting silent tampering.
