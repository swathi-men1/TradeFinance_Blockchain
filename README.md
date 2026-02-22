# Trade Finance Blockchain Explorer

> A modern, blockchain-inspired trade finance platform with immutable ledger tracking, document management, and intelligent automated risk assessment.

**🌐 Live Demo:** [https://showcasego.netlify.app](https://showcasego.netlify.app)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688.svg?style=flat&logo=FastAPI)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat&logo=React)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg?style=flat&logo=TypeScript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791.svg?style=flat&logo=PostgreSQL)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat&logo=Docker)](https://www.docker.com)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://semver.org)

---

## 📖 Overview

Trade Finance Blockchain Explorer is a comprehensive, secure platform tailored for managing trade finance operations. Engineered for banks, corporations, auditors, and administrators, the system enforces strict role-based workflows, ensuring cryptographic integrity, an immutable audit trail, and proactive counterparty risk evaluation.

### Key Capabilities

- **Secure Trade Workflow** - Bank-initiated trade transactions safeguarding the integrity of digital trade agreements.
- **Document Management** - Secure upload, storage, and SHA-256 hash verification of vital trade documents.
- **Immutable Ledger** - Blockchain-inspired append-only system-generated audit trail capturing all critical actions.
- **Rule-Based Risk Engine** - Transparent algorithmic scoring triggering alerts on disputes and integrity mismatches.
- **Compliance Transparency** - Dedicated auditor access ensuring uninterrupted oversight over transactions and documents.
- **Role-Based Access Control (RBAC)** - Granular functionality silos for Bank, Corporate, Auditor, and Admin entities.

---

## 🚦 Quick Start Guide

### ✅ Prerequisites
- Docker Desktop (v20.10+)
- Docker Compose (v2.0+)
- Ports available: 80, 8000, 5432, 9000, 9001

### 🚀 Step 1: Installation & Booting

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TradeFinance_Blockchain
   ```

2. **Start all services**
   ```bash
   docker-compose up --build -d
   ```

### 🎯 Step 2: Seed the Database (First Time Only)

Create test users for all system roles. Run this script **inside** the backend Docker container:

```bash
docker-compose exec backend python seed_database.py
```

*Expected output: Generates default users for Admin, Bank, Corporate, and Auditor roles.*

### 🔑 Step 3: Default Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tradefinance.com | admin123!@# |
| Corporate | corporate@company.com | corporate123!@# |
| Bank | bank@globalbank.com | bank123!@# |
| Auditor | auditor@auditfirm.com | auditor123!@# |

### 🌐 Step 4: Access the Application Routes

1. **Frontend UI**: `http://localhost` (Landing Page & Login)
2. **Backend API URL**: `http://localhost:8000`
3. **API Documentation**: `http://localhost:8000/docs` (Interactive Swagger Docs)
4. **Storage Console (MinIO)**: `http://localhost:9001` (Creds: `minioadmin` / `minioadmin`)

---

## 👥 Roles & Workflows

| Role | Core Responsibilities |
|------|-----------------------|
| **Bank** | Originates ALL trades. Reviews and oversees the progression of trades. Monitors Risk Scores dynamically calculated for participating corporations. |
| **Corporate** | Participates merely in trades allocated to them. Uploads digital documentation to meet trade requirements. Able to raise a dispute against a counterpart. |
| **Auditor** | Enjoys global read-only transparency. Assesses compliance alerts, reviews document hashing history, and oversees the immutable ledger timeline and health. |
| **Admin** | Executes system-wide CRUD on users. System monitoring. Can't directly spoof standard trades. |

### The Trade Workflow & Risk Assessment
1. **Initiation**: A **Bank** matches a Corporate Buyer to a Corporate Seller and registers the Trade as `PENDING`.
2. **Execution**: Corporate users upload required documents. The system hashes them simultaneously, locking their state securely. 
3. **Tracking**: The trade advances to `IN_PROGRESS` and eventually `COMPLETED`.
4. **Disputes & Risk**: If a trade falls into a `DISPUTED` state, or if a subsequently uploaded document fails SHA-256 verification via the Auditor dashboard, the system's **Risk Engine** triggers heavily weighted penalties—automatically shifting offending corporate profiles into `HIGH` risk classifications for Banks to review.

---

## 🛠️ Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| FastAPI | 0.109.0 | High-performance async API framework |
| PostgreSQL | 14+ | Relational data persistence |
| SQLAlchemy | 2.0.25 | ORM and complex query builder |
| Alembic | Latest | Schema migrations |
| MinIO | Latest | S3-compatible object storage |
| Python | 3.11 | Runtime environment |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18 | Declarative UI framework |
| TypeScript | 5 | Type-safe front-end architecture |
| Vite | 5 | Build tool and fast dev server |
| CSS3 | - | Custom styling layout (Glassmorphism) |
| Axios | Latest | Promise-based HTTP client |
| React Router | 6 | Client-side routing management |

---

## 🛡️ Security Features Enabled

- ✅ **Admin Self-Registration Blocked**: Standard `/register` endpoint strictly enforces `CORPORATE` role baseline creation.
- ✅ **Role-Based Access Control**: Middleware route protection rejects unauthorized API calls universally.
- ✅ **Audit Logging**: Separate, tamper-proof logs for Administrative governance steps.
- ✅ **JWT Authentication**: Secure stateless token-based authorization.
- ✅ **Password Hashing**: Bcrypt with adaptive salt arrays.
- ✅ **Document Integrity**: SHA-256 hash generation and realtime mathematical evaluation.
- ✅ **Hash Chains**: Appended ledger items carry the mathematical hash of previous actions to flag database tampering.

---

## 📖 API Reference Highlights

*All actions executed below automatically spawn encrypted, un-alterable records within the system Ledger.*

**Documents**
```http
POST   /api/v1/documents/upload      # Upload file & trigger SHA-256 hashing
GET    /api/v1/documents/{id}/verify # Validate hash integrity against ledger record
```

**Trades**
```http
POST   /api/v1/trades              # Vault-locked to Bank creation only
PUT    /api/v1/trades/{id}/status  # Progress trade across valid workflow states
```

**Risk Engine**
```http
POST   /api/v1/risk/calculate      # Algorithmically re-evaluate counterparty footprint
```

**Ledger Transparency**
```http
GET    /api/v1/ledger/verify-chain # Cryptographically assert entire database timeline is un-tampered
```

*(Interactive Documentation is directly accessible locally at `http://localhost:8000/docs` upon spinning up the Docker network.)*

---

## 🐛 Troubleshooting

* **Issue:** "Database already has X user(s). Skipping seed."
  **Solution:** Normal behavior if you've already run the seeder script. The users persist correctly.
* **Issue:** Connection / CORS Errors
  **Solution:** Ensure you are accessing the frontend via `http://localhost` (not `127.0.0.1` unless explicitly configured). Ensure the backend container remains healthy via `docker-compose ps`.

---

## 📝 License

MIT License - see LICENSE file for details

---

**Built with ❤️ for secure, transparent, and modernized trade finance operations.**
