# Trade Finance Document Management System

## Overview

Trade Finance Document Management System is a secure web application designed to manage trade-related documents such as Letters of Credit, Bills of Lading, Commercial Invoices, and Export/Import documents.

The system ensures secure handling of documents through:

- SHA-256 based tamper detection
- Ledger-based audit trail logging
- Soft delete with quarantine storage
- Rule-based risk scoring (0–100)
- Role-based access control (Corporate / Bank / Auditor / Admin)

This project was developed under the Infosys Springboard Internship Program and deployed as a fully operational web application.

---

## Developer Information

Developer: M.V. Ramya  
Program: Infosys Springboard Internship  
Timeline: December 2025 – February 2026 (8 Weeks)  
Status: Production Deployed and Operational  
Email: mvramya2003@gmail.com

---

## Live Application

Live URL: https://trade-finance-flask.onrender.com

---

## Problem Statement

Trade finance involves high-value international transactions that rely heavily on document authenticity. Traditional systems often lack strong tamper detection mechanisms, transparent audit trails, and automated risk monitoring.

This system aims to solve these problems using cryptographic hashing, audit ledger tracking, and automated risk scoring.

---

## Objectives

- Secure upload and management of trade finance documents
- Detect tampering using SHA-256 hash verification
- Maintain a permanent audit ledger of critical actions
- Implement soft deletion using quarantine storage
- Provide rule-based risk scoring for users
- Ensure secure access using JWT and role-based access control
- Support deployment-ready architecture with PostgreSQL

---

## Technology Stack

Backend: Flask (Python)  
Database: PostgreSQL (Production), SQLite (Development)  
ORM: SQLAlchemy  
Authentication: JWT  
Hash Algorithm: SHA-256  
Frontend: HTML, CSS, JavaScript  
Deployment: Render  
Production Server: Gunicorn

---

## Security Implementation

Password Security:

- Passwords are stored using PBKDF2 hashing
- 260,000 iterations with random salt

Authentication:

- JWT token-based authentication
- Token expiration enforced (24 hours)

Authorization:

- Role-based access control is implemented at backend level
- Data is filtered based on user role and ownership

---

## User Roles

Corporate User:

- Upload documents
- View their own uploaded documents
- Soft delete only their own documents
- View personal risk score

Bank User:

- View all documents
- Verify and update document status (PENDING, ACCEPTED, REJECTED)
- View ledger history
- Soft delete documents with reason

Auditor:

- Read-only access
- View all documents
- View integrity verification results
- View ledger history

Admin:

- View all documents including deleted documents
- Restore quarantined documents
- Monitor system activity

---

## Key Features

1. Document Upload and Storage

- Corporate users upload documents via /upload-document
- Files are stored in uploads/
- Duplicate uploads are prevented using SHA-256 hash comparison

2. SHA-256 Tamper Detection

- Hash is calculated during upload and stored in database
- Hash is recalculated during retrieval and compared
- If mismatch occurs, the document is flagged as tampered

3. Ledger Audit Logging
   All major actions are recorded in the ledger:

- Upload
- Status update
- Soft delete
- Restore
- Tamper detection

Ledger is append-only, ensuring audit integrity.

4. Document Verification Workflow

- Every uploaded document starts in PENDING status
- Bank user verifies and updates status to ACCEPTED or REJECTED
- Every status update is logged in the ledger

5. Soft Delete and Quarantine
   Instead of permanent deletion:

- Document is marked as deleted
- File is moved to quarantine/
- Metadata is stored such as deleted_by, deleted_at, and delete_reason

6. Restore Functionality
   Admin and Bank users can restore deleted documents:

- File moved back from quarantine/ to uploads/
- Document becomes active again
- Restore action is logged in ledger

7. Rule-Based Risk Scoring (0–100)
   Risk score is calculated using weighted factors:

Document Integrity: 40%  
Ledger Activity: 30%  
Transaction Behavior: 20%  
External Country Risk: 10%

Risk Levels:

- LOW: 0 – 30
- MEDIUM: 31 – 70
- HIGH: 71 – 100

Risk Score Fields Stored:

- risk_score
- risk_level
- risk_reason
- risk_updated_at

Risk score is recalculated automatically when:

- Document upload
- Document delete
- Document restore
- Bank status update
- Transaction changes

---

## API Endpoints

Authentication:

- POST /signup
- POST /login

Documents:

- POST /upload-document
- GET /my-documents
- GET /documents
- PUT /documents/{doc_id}/status
- DELETE /documents/{doc_id}
- PUT /documents/{doc_id}/restore
- GET /documents/{doc_id}/preview

Ledger:

- GET /documents/{doc_id}/ledger

Risk Scoring:

- GET /users/{email}/risk-score

---

## Frontend Pages

- login.html
- corporate.html
- bank.html
- auditor.html
- admin.html

---

## Application Workflow

1. Corporate logs in and uploads a document
2. SHA-256 hash is generated and stored
3. Ledger entry is created for upload action
4. Bank verifies document and updates status
5. Auditor reviews ledger and integrity results
6. Deleted documents are moved to quarantine
7. Admin/Bank can restore deleted documents
8. Risk score recalculates after every major action

---

## Deployment Journey

Timeline: December 2025 to February 2026 (8 Weeks)

Month 1:

- Research and architecture planning
- Database schema finalized
- Authentication and RBAC implemented
- Document upload and integrity verification completed
- Ledger and dashboards developed

Month 2:

- Risk scoring implemented
- Testing and debugging
- PostgreSQL migration for production
- Render deployment configuration completed
- Production deployment issues resolved

Final deployment is stable and operational.

---

## How to Run Locally

Install dependencies:

```bash
pip install -r requirements.txt
Run application:
python app.py

Contact:
Developer: M.Venkata Ramya
Email: mvramya2003@gmail.com
```
