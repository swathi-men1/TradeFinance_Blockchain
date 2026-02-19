# Trade Finance Blockchain Explorer

> **A Cross-Border Commerce Platform built on cryptographic audit chain principles.**

![Status](https://img.shields.io/badge/Status-Active-success)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-Proprietary-orange)

## 📌 Overview

The **Trade Finance Blockchain Explorer** is a full-stack solution designed to manage and authenticate international trade finance certificates. It utilizes a cryptographic audit chain to ensure the integrity, provenance, and non-repudiation of every certificate lifecycle event.

### Key Capabilities
*   **Certificate Ingestion:** Secure drag-and-drop upload with SHA-256 hash verification.
*   **Cryptographic Audit Chain:** Tamper-evident ledger for all transaction events.
*   **Threat Assessment:** Algorithmic risk scoring (0–100) with real-time analysis.
*   **Role-Based Access Control (RBAC):** Distinct portals for Admin, Corporate, Bank, and Auditor.
*   **Compliance Console:** dedicated views for auditing and alert management.

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 18, TypeScript, TailwindCSS, Vite |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy |
| **Database** | PostgreSQL 15 |
| **Storage** | MinIO (S3-Compatible) |
| **Infrastructure** | Docker, Docker Compose |

---

## 🚀 Deployment Guide

### Option A: Docker (Recommended)

The easiest way to run the platform is using Docker Compose.

```bash
# 1. Clone the repository
git clone <repository-url>
cd TradeFinance_Blockchain

# 2. Start all services
docker-compose up -d --build

# 3. Access the application
# Frontend: http://localhost:5173 (or http://localhost:80 in production)
# Backend API: http://localhost:8000
```

### Option B: Manual Setup

#### Prerequisites
*   Node.js 18+
*   Python 3.11+
*   PostgreSQL 15

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start Database & Migrations
createdb trade_finance_db
export DATABASE_URL="postgresql://user:password@localhost:5432/trade_finance_db"
alembic upgrade head

# Run Server
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Default Credentials

Use these accounts to explore different roles within the system.

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@tradefinance.com` | `AdminSecure2026!` |
| **Corporate** | `corporate@company.com` | `corporate@company.com` |
| **Bank** | `bank@globalbank.com` | `BankSecure2026!` |
| **Auditor** | `auditor@auditfirm.com` | `AuditSecure2026!` |

---

## ⚙️ Environment Variables

### Backend (`.env`)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/trade_finance_db
SECRET_KEY=your-secret-key-change-this-in-production-min-32-characters
# MinIO Config
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
```

### Frontend (`.env`)
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 👨‍💻 Author

**Abdul Samad**
*   *Project developed as part of Infosys Internship Program 6.0*

