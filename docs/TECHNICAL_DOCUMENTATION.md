# Technical Documentation: Trade Finance Blockchain Explorer

This document provides a deep, developer-level technical overview of the Trade Finance Blockchain Explorer. It details the system architecture, mathematical risk algorithms, cryptographic compliance measures, and underlying business logic designed to meet strict trade finance auditing standards.

---

## 1️⃣ SYSTEM OVERVIEW

**The Problem:** Traditional international trade finance relies heavily on fragmented, paper-based documents (like Bills of Lading and Letters of Credit) or siloed digital PDFs. This lack of transparency introduces severe vulnerabilities, including document forgery, double-financing fraud, and obscured counterparty risk. Additionally, the lack of an immutable audit trail makes compliance investigations slow and resource-intensive.

**The Solution:** The Trade Finance Blockchain Explorer addresses these challenges by creating a zero-trust, mathematically verifiable environment. It achieves this through a blockchain-inspired append-only ledger, strict Role-Based Access Control (RBAC), and automated rule-based risk scoring. By anchoring document authenticity to cryptographic SHA-256 hashes generated dynamically upon upload, the system guarantees that any tampering or backdating is immediately detected and penalized, radically streamlining compliance and fraud prevention.

---

## 2️⃣ SYSTEM ARCHITECTURE (TECHNICAL)

The application employs a modern, decoupled client-server architecture.

*   **Frontend (React + TypeScript):** A single-page application (SPA) that renders role-specific UI components dynamically. State is managed locally to prevent sluggishness during heavy ledger rendering.
*   **Backend (FastAPI):** An asynchronous Python API. It utilizes Starlette for high-performance HTTP routing and Pydantic for strict schema validation.
*   **Database (PostgreSQL):** A relational database management system enforcing ACID compliance across deeply related entities (users, trades, documents). It utilizes `JSONB` for flexible ledger metadata storage.
*   **Storage (MinIO / S3):** Scalable object storage holding the binary document files, keeping the relational database lean.
*   **Deployment (Docker):** The entire stack is containerized using Docker and Docker Compose, ensuring identical execution across development, testing, and production environments.

**Request Flow:** 
1. The UI (React) dispatches an Axios HTTP request with a JWT Bearer token.
2. FastAPI middleware decodes and cryptographically verifies the signature of the JWT, extracting the user ID and role.
3. FastAPI dependency injection verifies RBAC restrictions (e.g., verifying the user is a `BANK`).
4. The service layer executes business logic via SQLAlchemy ORM (querying PostgreSQL) and Boto3 (interacting with MinIO).
5. The synchronous database transaction commits, and a serialized JSON response is returned to the UI.

---

## 3️⃣ TECHNOLOGY & LIBRARY JUSTIFICATION

*   **FastAPI:** Chosen for native `async`/`await` support maximizing IO-bound performance (crucial for API calls to MinIO and Postgres simultaneously), and automatic OpenAPI (Swagger) documentation generation.
*   **SQLAlchemy:** Provides secure ORM abstraction, drastically reducing SQL injection vulnerabilities, and simplifying complex table joins.
*   **Alembic:** Used for incremental, version-controlled repository database schema migrations in a distributed development environment.
*   **PostgreSQL:** Chosen over NoSQL for its strict relational integrity constraints and ACID compliance—mandatory for financial and trade operations.
*   **MinIO:** Provides an S3-compatible API, allowing local containerized development that exactly mirrors AWS S3 production deployments.
*   **React & TypeScript:** TypeScript introduces static typing to React, catching variable shape mismatches at compile time rather than runtime—reducing critical bugs in complex nested financial objects.
*   **Axios:** A mature HTTP client utilizing interceptors to automatically append JWT tokens to all outgoing requests.
*   **JWT (JSON Web Tokens):** Enables *stateless* authentication. The backend does not need to query a session table for every request, enabling massive horizontal scalability.
*   **Bcrypt:** Employs salted password hashing with an adaptive work factor, intentionally slowing down hash generation to severely mitigate brute-force and rainbow-table attacks.
*   **SHA-256:** A highly secure cryptographic hash function used to fingerprint documents ensuring tamper detection.

---

## 4️⃣ DATABASE DESIGN & RELATIONSHIPS

The PostgreSQL relational design is highly normalized.

*   **`users`:** Anchor for auth and RBAC. Contains `hashed_password`, `role` (ENUM), and a generated `user_code` for masking real identities when appropriate.
*   **`documents`:** Stores file metadata (`filename`, `doc_type`), the `s3_key` URI, and the `hash` (SHA-256). Contains an `owner_id` (FK to `users`).
*   **`trade_transactions`:** Links `buyer_id` and `seller_id` (both FKs pointing to `users`). Maintains the current `status` and financial `amount`.
*   **`ledger_entries`:** The append-only audit trail. Links `actor_id` (FK `users`), optional `document_id`, the executed `action` (ENUM), a flexible `entry_metadata` (JSONB) column, and crucially, `previous_hash` and `entry_hash` strings.
*   **`risk_scores`:** Links `user_id` (FK). Caches the current `score` (0-100), ENUM `category` (LOW, MEDIUM, HIGH), and a textual `rationale` for the auditor's review.
*   **`audit_logs`:** Tracks system administrator actions (e.g., modifying users) separated from general ledger events to ensure highest-level governance traceability.

*Constraints:* Foreign keys enforce `ON DELETE CASCADE` appropriately or restrict deletion to preserve historical ledger consistency.

---

## 5️⃣ TRADE WORKFLOW LOGIC (ALGORITHM)

The status transition logic is heavily restricted to prevent abuse.

1.  **Initiation:** A Bank user creates the trade specifying the Corporate Buyer and Seller. The trade initializes as `PENDING`. *Note: Corporate users cannot initiate trades.*
2.  **Participation:** Corporate parties are notified. They upload required supporting `documents` (e.g., Invoices, Packing Lists).
3.  **Verification & Progression:** The Bank reviews the uploaded components. The status is advanced to `IN_PROGRESS`.
4.  **Completion / Dispute:** If goods and payments clear, the Bank marks it `COMPLETED`. At any point, if a contract breach occurs, any involved party can flag the trade as `DISPUTED`.
5.  **Ledger Logging:** Every state transition automatically generates a `LedgerEntry`, permanently recording the actor, timestamp, old status, and new status.

---

## 6️⃣ DOCUMENT VERIFICATION ALGORITHM

The system prevents digital forgery via the following deterministic algorithm:

1.  **Upload & Fingerprint:** When a file is uploaded, the backend reads the binary payload into memory and mathematically computes its SHA-256 hash.
2.  **Storage:** The file is streamed to MinIO. The computed SHA-256 hash is permanently saved to PostgreSQL in the `documents` table.
3.  **Verification Trigger:** When an Auditor or Bank runs a verification check, the backend retrieves the file blob directly from MinIO.
4.  **Recalculation:** The backend recalculates the SHA-256 hash of the freshly downloaded blob.
5.  **Validation:** The system compares the recalculated hash to the database hash. 
6.  **Outcome:** If `new_hash === database_hash`, the document is pristine. A single altered pixel or character alters the SHA-256 output entirely, resulting in a mismatch, logging a failed ledger entry, and triggering a critical risk penalty against the uploader.

---

## 7️⃣ LEDGER & HASH CHAIN INTEGRITY

**Structure:** A `ledger_entry` contains `previous_hash` and `entry_hash`.

**Hash Generation:** `entry_hash = SHA256(action + actor_id + timestamp + JSON(metadata) + previous_hash)`.

**Tamper Detection Mechanism:** Because `Entry N` uses the hash of `Entry N-1` in its own calculation, modifying the data of `Entry 3` changes its hash. Consequently, the stored `previous_hash` of `Entry 4` no longer matches the re-calculated hash of `Entry 3`. The chain breaks instantly and visibly.

**Inspiration vs. Actual Blockchain:** A standard blockchain relies on distributed proof-of-work/proof-of-stake across thousands of unpredictable nodes to achieve consensus. Our system implements the core *integrity mechanism* (cryptographic hash chaining) but maintains a *centralized* database. This provides enterprise-level throughput speeds required by a bank, without the heavy energy and latency costs of a globally distributed network, while still satisfying internal auditor immutability requirements.

---

## 8️⃣ RISK SCORING ENGINE (MATHEMATICAL LOGIC)

The risk scoring utilizes a transparent, algorithmic weighted model (0–100 scale). We avoid Machine Learning to ensure regulatory explainability.

**Formula:**
`Final Risk Score = (DI × W1) + (LB × W2) + (TB × W3) + (ER × W4)`

**Variables & Weights:**
*   **DI (Document Integrity Score):** Baseline 1.0. Drops heavily per failed SHA-256 hash check. (Weight: 40%) - *Fraud indicator.*
*   **LB (Ledger Behavior Score):** Baseline 1.0. Drops slightly for repeated manual amendments or failed workflow progression steps. (Weight: 25%) - *Incompetence indicator.*
*   **TB (Transaction Behavior Score):** Baseline 1.0. Drops per trade marked `DISPUTED`. (Weight: 25%) - *Credit risk indicator.*
*   **ER (External Risk Score):** Derived from mocked country-code mapping. (Weight: 10%) - *Sanctions/Geopolitical indicator.*

**Example Calculation:**
A corporate seller has uploaded 10 documents successfully (DI=1.0), but recently became involved in a `DISPUTED` trade (TB drops to 0.6).
Total Score = (1.0 * 40) + (1.0 * 25) + (0.6 * 25) + (1.0 * 10) = 40 + 25 + 15 + 10 = 90.
A score of 90 shifts them from `LOW` risk to `MEDIUM` risk automatically.

---

## 9️⃣ RISK TRIGGER ALGORITHMS

To ensure real-time reporting, the Risk Engine executes asynchronously on the following event-driven triggers:
*   `DocumentService.verify_document()` yields `False` -> Triggers severe recalculation.
*   `TradeService.update_trade_status()` to `DISPUTED` -> Recalculates both the buyer's and seller's risk matrices.
*   Admin Bulk Operations -> Triggers system-wide sweeps calculating time-decaying variables.

The calculation reads historical records dynamically, generating the score, category, and a textual rationale appended directly to the database row for auditor transparency.

---

## 10️⃣ SECURITY ARCHITECTURE

*   **Authentication Flow:** Client sends email/password. Server hashes input, compares it against the stored bcrypt hash. If valid, signs a JWT with the `SECRET_KEY` including `{sub: user_id, role: user_role, exp: +15m}`.
*   **RBAC Enforcement:** Top-level FastAPI dependencies (e.g., `def require_role(roles: List[str])`) decode the JWT on incoming requests. If a `CORPORATE` user calls `POST /api/trades`, the backend intercepts and drops the request with a `403 Forbidden` before the controller logic executes.
*   **File Access Control:** Files stored in MinIO are not publicly accessible via browser. Clients hit the backend, which either proxies the byte stream or generates temporary (expiring) S3 Presigned URLs if authorized by RBAC.

---

## 11️⃣ PERFORMANCE & SCALABILITY

*   **Async API Scaling:** Because FastAPI natively exploits `asyncio`, the server thread does not block while waiting for a file stream to upload to S3 or a DB query to execute; it processes other requests concurrently, maximizing throughput.
*   **Stateless Scaling:** JWT authentication relies heavily on cryptographic CPU verification, circumventing the traditional database bottleneck of session lookups. This allows horizontal scaling of backend Docker containers indefinitely.
*   **Database Indexing:** Key columns (`owner_id`, `trade_id`, `created_at`) are indexed in PostgreSQL avoiding full table scans when rendering deep ledger timelines.

---

## 12️⃣ COMPLIANCE & AUDITABILITY

The platform is built strictly for auditor transparency.
*   **Immutability:** The restriction on `UPDATE`/`DELETE` inside the ledger prevents malicious actors from rewriting history.
*   **Traceability:** Every ledger entry has a persistent `actor_id`. Actions cannot be performed anonymously.
*   **Audit Logging:** Changes to the system structure itself (Admin resetting a password) skip the standard trade ledger and hit a specialized Audit Log, ensuring system-level operations adhere to compliance mandates.

---

## 13️⃣ ERROR HANDLING & VALIDATION LOGIC

*   **Input Validation:** Pydantic schemas forcefully type-check incoming JSON. Providing a string to an integer `amount` field instantly returns an auto-generated `422 Unprocessable Entity` detailed error array.
*   **File Validation:** Upload endpoints strictly validate `mime_type` and enforce file size constraints.
*   **Exception Handling:** Business errors (e.g., "Trade cannot transition from COMPLETED to PENDING") are wrapped in `HTTPException(400)` raising descriptive messages rendered dynamically as Toast notifications on the React frontend.
