# Trade Finance Blockchain System

A full‑stack trade finance platform prototype implementing document integrity
verification, blockchain‑style audit logging, and role‑based workflow
management.

## Overview

This project demonstrates a secure trade transaction management system where
corporates, banks, auditors and administrators interact with a shared ledger of
documents. Key capabilities:

- Tamper‑evident document storage using SHA‑256 hashing
- Blockchain‑style ledger with hash chaining for auditability
- Role‑based access control (RBAC)
- Document lifecycle management (upload → amend → verify/reject)
- Chain validation endpoint for integrity checks
- JWT authentication with password hashing

The software follows a layered architecture separating frontend, backend and
database concerns. The UI is a React/Vite single‑page application; the backend
is a FastAPI service with SQLAlchemy models persisted in PostgreSQL.

> **Note:** the frontend contains additional pages (`/trades`, `/risk`, etc.)
> that expect APIs not yet implemented by the backend. For now only the
> document/ledger routes are functional.

---

## Repository structure

```
TradeFinance_Blockchain/
└── chaindocs/
    ├── backend/    FastAPI service (Python)
    │   └── app/
    │       ├── core/          config, database, security, jwt, deps
    │       ├── models/        SQLAlchemy models (User, Document, Ledger,
    │       │                    Organization, enums)
    │       ├── routers/       (currently unused – routes live in main.py)
    │       ├── schemas/       Pydantic schemas
    │       ├── services/      business logic helpers
    │       └── main.py        all HTTP endpoints
    └── frontend/   React 19 + TypeScript app (Vite, Tailwind, shadcn/ui)
        ├── src/api/          axios instance
        ├── src/components/   reusable UI pieces
        ├── src/pages/        dashboard and utility pages
        ├── src/context/      authentication context
        └── src/layouts/      shared layout for protected routes
```

Additional files include `chaindocs/backend/requirments.txt` and standard
frontend configuration (`package.json`, `vite.config.js`, etc.).

---

## Technology stack

| Layer       | Technologies                                      |
|-------------|---------------------------------------------------|
| Backend     | Python 3.11, FastAPI, SQLAlchemy, Alembic, PostgreSQL |
| Authentication | JWT (OAuth2PasswordBearer), bcrypt hashing      |
| Storage     | PostgreSQL (database); documents hashed in memory |
| Frontend    | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Infrastructure | Uvicorn/Gunicorn (ASGI), optional MinIO/S3-compatible storage |

(References to MinIO and Postgres appear in configuration but the current
implementation stores files only as hashes; no object store is populated.)

---

## System architecture

Frontend (React + TS) → REST API (FastAPI) → PostgreSQL database

Key backend layers:

1. **Authentication** – JWT bearer tokens issued via `/login`.
2. **Authorization** – `require_roles` dependency enforces RBAC on endpoints.
3. **Service/Business logic** – document handling and ledger operations.
4. **Data access** – SQLAlchemy models representing users, documents and
   ledger entries.
5. **Blockchain ledger** – each action creates a SHA‑256 hash that includes the
   previous block’s hash, establishing a tamper‑evident chain.
6. **File integrity** – uploaded documents are hashed and stored in the `documents`
   table; the hash is referenced in ledger entries.

---

## User roles and permissions

- **Admin** – full access; can view ledger, create organizations, manage users.
- **Bank** – approve/reject documents; view ledger entries.
- **Corporate** – upload and amend documents within their organization.
- **Auditor** – view all documents and ledger history; validate chain integrity.

Role checks are performed using the `require_roles` dependency in `main.py`.

---

## Core features

- JWT‑based authentication (POST `/login`, `register`)
- Registration and organization bootstrapping (`/register`, `/create-org`)
- Document upload (`/upload-document`) and amendment (`/amend-document/{id}`)
- Document status transitions: pending → verified/rejected by banks
- Blockchain‑style ledger entries captured on every action
- Document history (`/document/{id}/history`) and chain validation
- Simple ledger listing (`/ledger`) for admins/banks/auditors
- Role‑based dashboards and components in frontend

> The backend does **not** currently implement trades, risk scoring,
> CSV export or the additional analytics routes referenced in the UI.

---

## Database structure

Important tables defined in `backend/app/models`:

- `users` – id, name, email, hashed_password, role, org_id
- `organizations` – id, name
- `documents` – id, filename, file_hash, version, uploaded_by, status,
  rejection_reason
- `ledger` – id, document_id, action, hash, previous_hash, performed_by,
  timestamp

Integrity mechanisms rely on:

- SHA‑256 hashing of document bytes
- Chained ledger hash: each `hash` is generated from previous hash and current
  data; mismatches flag chain breaks.

No tables exist for trades, risk scores, or exports (those are future
extensions).

---

## Running the project

### Backend

```powershell
cd chaindocs/backend
python -m venv venv
venv\Scripts\activate   # Windows PowerShell
pip install -r requirments.txt
# create database and tables (handled automatically on startup)
python -m uvicorn app.main:app --reload --port 8000
```

API base URL: `http://localhost:8000` 
Swagger docs available at: `http://localhost:8000/docs`

### Frontend

```bash
cd chaindocs/frontend
npm install
npm run dev
```

The development server runs on `http://localhost:5173` (default Vite port).

---

## Environment configuration

Example `.env` entries (backend):

```
DATABASE_URL=postgresql://postgres:PG25@localhost:5432/tradefinance
SECRET_KEY=CHANGE_THIS_SECRET
TOKEN_EXPIRE_MINUTES=30
MINIO_ENDPOINT=http://localhost:9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_BUCKET=tradefinance
MINIO_SECURE=False
ALLOWED_ORIGINS=http://localhost:5173
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
```

(The code currently ignores object storage configuration; document data is
handled in memory.)

---

## Security design

- Passwords hashed with bcrypt (`app/core/security.py`)
- JWT bearer tokens with expiration
- RBAC enforced through dependencies
- Input validation with Pydantic schemas
- CORS allowed origins configurable via environment
- Ledger immutability and chain validation for tamper detection

---

## Project status

- ✅ End‑to‑end document upload, amendment, verification and rejection flows
- ✅ Ledger entries created for every action and can be queried/validated
- ✅ Role‑based access enforced backend and frontend
- ✅ React UI with multiple dashboards, though many pages rely on missing
     endpoints
- ⚠️ Trade workflows, risk scoring and exporting are stubbed in UI only
- ⚠️ No automated tests or deployment scripts included

### Sample accounts (for testing)

```json
{ "email": "corporate@abcexport.com", "password": "Corp@123", "org_id": 5 }
{ "email": "bank@globaltradebank.com", "password": "Bank@123", "org_id": 6 }
{ "email": "auditor@compliancegroup.com", "password": "Audit@123", "org_id": 7 }
{ "email": "admin@tradefinance.com", "password": "Admin@123", "org_id": 1 }
```

---

## Next steps

- Implement trade and risk APIs to match frontend expectations, or refactor
  UI to remove unused pages
- Move route logic into `app/routers` and add unit/integration tests
- Add Alembic migrations for schema changes
- Integrate object storage (MinIO/S3) for file persistence
- Harden security (password policies, rate limits, input sanitization)
- Deploy using Gunicorn/Uvicorn behind HTTPS with configuration management

---

This README serves as a living document; update it as the project evolves to
keep the architecture, feature list, and setup instructions accurate.