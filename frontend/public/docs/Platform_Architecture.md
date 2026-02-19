<!-- FRS | Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad -->

# Platform Architecture

> Architectural blueprint for the Trade Finance Blockchain Explorer platform.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Top Nav Bar │  │ Theme Engine │  │ Auth Context      │  │
│  │ Breadcrumbs │  │ Light / Dark │  │ JWT + localStorage│  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Page Components                         │   │
│  │  Dashboard | Certificates | Transactions | Audit     │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Service Layer (Axios)                    │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / REST
┌──────────────────────────▼──────────────────────────────────┐
│                      API Layer                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              FastAPI Router                           │  │
│  │  Auth | Documents | Trades | Ledger | Risk | Admin   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Business Logic Services                      │  │
│  │  Hashing | Chain Validation | Risk Scoring            │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      Data Layer                             │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │  PostgreSQL 15 │  │    MinIO     │  │   Alembic      │ │
│  │  (Relational)  │  │ (Objects/S3) │  │  (Migrations)  │ │
│  └────────────────┘  └──────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Cryptographic Audit Chain

The platform implements a simplified blockchain concept for establishing certificate provenance:

1. Each trade has an ordered chain of ledger entries
2. Every entry computes: `hash = SHA-256(trade_id + action + actor_id + timestamp + previous_hash)`
3. The first entry in a chain uses a genesis hash (`"0" * 64`)
4. Chain integrity is verified by recomputing all hashes and comparing

This creates a tamper-evident, non-repudiable record of all certificate lifecycle events.

---

## Security Architecture

| Layer | Mechanism |
|-------|-----------|
| Transport | HTTPS (TLS in production) |
| Authentication | JWT Bearer tokens with bcrypt |
| Authorization | Role-based route guards (frontend + backend) |
| Data Integrity | SHA-256 hash-chaining for audit trail |
| Input Validation | Pydantic schemas for all API inputs |
| CORS | Configurable allowed origins |

---

## Deployment Topology

### Development
```
localhost:5173 (Vite) → localhost:8000 (Uvicorn) → localhost:5432 (PostgreSQL) + localhost:9000 (MinIO)
```

### Production (Docker)
```
nginx (reverse proxy) → frontend (static) + backend (gunicorn) → PostgreSQL + MinIO
```

---

**Developer**: Abdul Samad
