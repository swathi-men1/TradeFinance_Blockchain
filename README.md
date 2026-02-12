# Trade Finance Document Verification & Risk Scoring System

## Overview

This project is a **Trade Finance Document Management System** designed to ensure secure handling of trade-related documents through:

- Hash-based integrity verification (Tamper Detection)
- Ledger-based audit logging
- Rule-based user risk scoring

The system supports multiple roles such as **Corporate**, **Bank**, **Auditor**, and **Admin**, ensuring proper access control, transparency, and compliance readiness.

---

## Objectives

- Enable secure upload and management of trade finance documents
- Detect tampering using SHA-256 hash verification
- Maintain a complete audit trail of all critical operations using ledger logs
- Implement soft deletion using quarantine storage instead of permanent deletion
- Calculate user risk score (0–100) using backend rule-based logic
- Support role-based access control (RBAC) for secure workflows

---

## Roles & Access Control

### Corporate User

- Upload trade finance documents
- View uploaded documents and their verification status
- Delete only their own documents (soft delete)
- View personal risk score details

### Bank User

- View all active trade documents
- Update document verification status (**PENDING / ACCEPTED / REJECTED**)
- View ledger history for any document
- Soft delete documents when required

### Auditor

- Read-only role
- View all active documents
- Verify document integrity status
- View ledger history for audit purposes

### Admin

- View all documents including deleted ones
- Restore soft deleted documents from quarantine
- Monitor users and system-level activity

---

## Key Features

### 1. Authentication & Authorization

- JWT-based authentication
- Role-based access control (RBAC)
- Protected endpoints secured using Bearer token authentication

---

### 2. Document Upload & Storage

- Corporate users upload documents using `/upload-document`
- Files are stored in the `uploads/` directory
- Duplicate uploads are prevented using SHA-256 hash comparison

---

### 3. Document Integrity Verification (Tamper Detection)

- SHA-256 hash is generated during upload and stored in the database
- During retrieval, the system recalculates hash from disk file
- If mismatch is detected, the document is flagged as **tampered**

---

### 4. Ledger Logging (Audit Trail)

Every major action is recorded in the **LedgerEntry** table, including:

- Document upload
- Status update
- Soft deletion
- Restore operation

Each ledger log contains:

- Action performed
- Actor email
- Timestamp
- Event metadata

---

### 5. Soft Delete + Quarantine Mechanism

Instead of permanent deletion:

- Document is marked as deleted (`is_deleted = True`)
- File is moved to the `quarantine/` folder
- Metadata is stored:
  - `deleted_by`
  - `deleted_at`
  - `delete_reason`

This ensures audit compliance and supports restoration.

---

### 6. Restore Functionality

Admin / Bank users can restore deleted documents:

- File is moved back to `uploads/`
- Document becomes active again
- Ledger entry is created for the restore action

---

### 7. Rule-Based Risk Scoring (0–100)

Risk scoring is calculated for users (primarily Corporate users).  
This is a **rule-based system**, not machine learning.

#### Risk Score Components

| Category              | Weight |
| --------------------- | ------ |
| Document Integrity    | 40%    |
| Ledger Activity       | 30%    |
| Transaction Behavior  | 20%    |
| External Country Risk | 10%    |

#### Risk Levels

- **LOW**: 0 – 30
- **MEDIUM**: 31 – 70
- **HIGH**: 71 – 100

#### Risk Score Fields Stored in Users Table

- `risk_score`
- `risk_level`
- `risk_reason`
- `risk_updated_at`

#### Risk Score Recalculation Triggers

Risk score is recalculated automatically when:

- A document is uploaded
- A document is deleted (soft delete)
- A document is restored
- Bank updates document status
- A transaction is created/updated

---

## Technology Stack

- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy
- **Authentication:** JWT (OAuth2PasswordBearer)
- **Frontend:** HTML, CSS, JavaScript
- **Hashing Algorithm:** SHA-256

---

## API Endpoints

### Authentication

| Method | Endpoint  | Description                 |
| ------ | --------- | --------------------------- |
| POST   | `/signup` | Register new corporate user |
| POST   | `/login`  | Login and receive JWT token |

### Documents

| Method | Endpoint                      | Description                             |
| ------ | ----------------------------- | --------------------------------------- |
| POST   | `/upload-document`            | Upload document (Corporate only)        |
| GET    | `/my-documents`               | View corporate user documents           |
| GET    | `/documents`                  | View all documents (Admin/Bank/Auditor) |
| PUT    | `/documents/{doc_id}/status`  | Update status (Bank only)               |
| DELETE | `/documents/{doc_id}`         | Soft delete (Admin/Bank/Corporate)      |
| PUT    | `/documents/{doc_id}/restore` | Restore from quarantine (Admin/Bank)    |
| GET    | `/documents/{doc_id}/preview` | Preview document (Public)               |

### Ledger

| Method | Endpoint                     | Description         |
| ------ | ---------------------------- | ------------------- |
| GET    | `/documents/{doc_id}/ledger` | View ledger history |

### Risk Scoring

| Method | Endpoint                    | Description                      |
| ------ | --------------------------- | -------------------------------- |
| GET    | `/users/{email}/risk-score` | Fetch and recalculate risk score |

---

## Frontend Pages

- `login.html`
- `corporate.html`
- `bank.html`
- `auditor.html`
- `admin.html`

---

## Application Workflow

1. Corporate user logs in and uploads a document
2. Backend stores the file and generates SHA-256 hash
3. Ledger entry is created for upload action
4. Bank user verifies the document and updates status
5. Auditor reviews ledger and integrity results
6. Deleted documents are moved to quarantine (soft delete)
7. Admin/Bank can restore deleted documents
8. Risk score recalculates automatically after major actions

---

## How to Run Locally

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
