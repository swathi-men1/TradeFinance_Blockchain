Trade Finance Blockchain System

A full-stack trade finance platform implementing document integrity verification, blockchain-style audit logging, and role-based workflow management.

1. Overview

This system enables secure trade transaction management between financial institutions and corporate entities. It ensures:

Tamper-evident document storage using SHA-256 hashing

Blockchain-style ledger with hash chaining

Role-Based Access Control (RBAC)

Trade lifecycle management (create → approve/reject)

Risk tracking and audit transparency

Secure JWT authentication

The application follows a layered architecture with strict separation between frontend, backend, and database.

2. Technology Stack
Backend

FastAPI

SQLAlchemy ORM

PostgreSQL

JWT Authentication

Bcrypt password hashing

MinIO (S3-compatible storage)

SHA-256 hashing

Frontend

React 19

TypeScript

Vite

shadcn/ui

Tailwind CSS

Infrastructure

PostgreSQL Database

MinIO Object Storage

Uvicorn / Gunicorn (ASGI server)

3. System Architecture

Frontend (React + TypeScript)
→ REST API (FastAPI)
→ PostgreSQL Database
→ MinIO Object Storage

Key Architectural Components:

Authentication Layer (JWT)

Authorization Layer (RBAC decorators)

Service Layer (Business logic)

Data Access Layer (SQLAlchemy models)

Blockchain Ledger Layer (hash chaining)

File Integrity Layer (SHA-256 verification)

4. User Roles and Permissions

Admin

Full system access
Manage users and organizations
View all trades and documents
Export data

Bank

Approve or reject trades
View all documents
Access analytics and risk data

Corporate

Create trades
Upload trade-related documents
View own trades
View own documents

Auditor

View all trades and documents
Verify document integrity
Export audit reports
Validate blockchain ledger

5. Core Features

JWT-based authentication

Role-based access control

Trade lifecycle management

Document upload with SHA-256 integrity hashing

Blockchain-style ledger with hash chaining

Tamper detection mechanism

Risk scoring engine

CSV export functionality

API documentation via Swagger

6. Trade Lifecycle


Corporate Create trades

Corporate uploads supporting documents

System hashes document and stores metadata

Bank reviews trade

Bank approves or rejects trade

Every action is logged in blockchain ledger

Auditor can verify integrity at any stage

7. Database Structure

Main Tables:

users

organizations

trade_transactions

documents

ledger_entries

risk_scores

Integrity Mechanisms:

SHA-256 document hashing

Ledger hash chaining (previous_hash + current_data → new_hash)

Tamper flag if hash mismatch detected

8. Running the Project
Backend
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000


Backend URL:
http://localhost:8000

Swagger Documentation:
http://localhost:8000/docs

Frontend
cd frontend
npm install
npm run dev


Frontend URL:
http://localhost:8080

9. Environment Configuration

Backend .env :

DATABASE_URL=postgresql://postgres:PG25@localhost:5432/tradefinance

SECRET_KEY=CHANGE_THIS_SECRET

TOKEN_EXPIRE_MINUTES=30

MINIO_ENDPOINT=http://localhost:9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_BUCKET=tradefinance
MINIO_SECURE=False

ALLOWED_ORIGINS=http://localhost:8080

BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000


10. Security Design

JWT Bearer authentication

Password hashing with bcrypt

Role validation using dependency injection

Input validation with Pydantic

CORS configuration

Integrity verification before trade approval

Ledger immutability enforcement

11. Production Deployment

Use Gunicorn with Uvicorn workers

Enable HTTPS

Restrict CORS origins

Use strong secret keys

Configure database backups

Deploy MinIO or AWS S3

Set environment variables securely

12. Project Status

The system is fully functional with:

End-to-end trade creation

Document upload and verification

Ledger tracking

Role-based access enforcement

Real-time frontend integration

Database persistence

IDS
{
  "email": "corporate@abcexport.com",
  "password": "Corp@123",
  "org_id": 5
}

{
  "email": "bank@globaltradebank.com",
  "password": "Bank@123",
  "org_id": 6
}

{
  "email": "auditor@compliancegroup.com",
  "password": "Audit@123",
  "org_id": 7
}

{
  "email": "admin@tradefinance.com",
  "password": "Admin@123",
  "org_id": 1
}
