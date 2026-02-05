# Functional Requirements Specification (FRS)
**Project:** Trade Finance Blockchain Explorer  
**Developer:** Abdul Samad

---

## 1. System Overview
The Trade Finance Explorer is a web-based platform that simulates a blockchain-lite environment for managing international trade documents and payments. It replaces paper-based workflows with a digitized, immutable ledger system.

## 2. Functional Modules

### Module A: Authentication & Identity
*   **FR-01**: System shall support JWT-based authentication.
*   **FR-02**: System shall enforce Organization Scoping (Users see only their org's data).
*   **FR-03**: System shall support roles: Admin, Corporate, Bank, Auditor.

### Module B: Document Registry (The Vault)
*   **FR-04**: System shall allow uploading of PDF/Image documents.
*   **FR-05**: System shall calculate SHA-256 hash upon upload.
*   **FR-06**: System shall store metadata (Doc Type, Number, Owner) in a relational database.

### Module C: Immutable Ledger
*   **FR-07**: System shall record every action (ISSUED, VERIFIED, PAID) in a strictly append-only Ledger table.
*   **FR-08**: Ledger entries shall link cryptographically to the previous entry (Hash Chaining).

### Module D: Trade Transactions
*   **FR-09**: System shall facilitate creating trade deals linked to registered documents.
*   **FR-10**: System shall prevent "Double Financing" (One document cannot fund multiple active trades).

### Module E: Risk Intelligence
*   **FR-11**: System shall display a Dynamic Risk Score for each Corporate entity.
*   **FR-12**: Score shall update automatically upon Trade Settlement or Dispute.
*   **FR-13**: Calculation Logic: 70% Internal Performance + 30% External Factors.

### Module F: Security & Compliance (Watchdog)
*   **FR-14**: System shall provide an on-demand "Integrity Check" to verify file persistence validation.
*   **FR-15**: System shall lock trades immediately if file tampering is detected (Self-Healing).

---

## 3. Non-Functional Requirements
*   **Security**: All APIs must be protected via Bearer Tokens.
*   **Scalability**: The backend is built on FastAPI for high-performance async processing.
*   **Data Integrity**: PostgreSQL is used with strict foreign key constraints to ensure relational consistency.

## 4. Technology Stack
*   **Backend**: Python (FastAPI), SQLAlchemy, Pydantic.
*   **Frontend**: React.js (TypeScript), Tailwind CSS.
*   **Database**: PostgreSQL.
*   **Task Queue**: Celery (Redis) - *Simulated for demo*.

---
*Submitted as partial fulfillment for intership 6.0.*
