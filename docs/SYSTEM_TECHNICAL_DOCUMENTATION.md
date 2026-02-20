# System Technical Documentation

## 1. SYSTEM OVERVIEW

The Trade Finance Blockchain Explorer is an enterprise-grade web application designed to digitalize, secure, and streamline international trade finance operations. It solves the real-world problem of trade document fraud, counterparty risk ambiguity, and lack of transparency across multi-party transactions (banks, corporate buyers/sellers, and auditors).

By employing a centralized, blockchain-inspired append-only ledger, the system guarantees cryptographic integrity without the computational overhead of distributed consensus. It offers robust compliance and fraud prevention benefits by anchoring document authenticity to SHA-256 hashes generated dynamically upon upload, making backdated or tampered invoices immediately detectable.

## 2. SYSTEM ARCHITECTURE

The application follows a modern decoupled architecture:

*   **Frontend**: A React single-page application (SPA) built with TypeScript and Vite. It serves role-specific dashboards with a glassmorphism UI design.
*   **Backend**: A high-performance Python ASGI API built with FastAPI. It handles complex business logic, risk scoring, and ledger enforcement.
*   **Database**: PostgreSQL serves as the relational persistent store, handling complex normalized relations like trades, nested documents, and auth records.
*   **Object Storage**: MinIO (an S3-compatible service) holds the actual binary files. Only file metadata and cryptographic hashes are persisted in the primary PostgreSQL database to reduce relational bloat.
*   **Infrastructure**: The system is fully containerized using Docker and orchestrated with Docker Compose, ensuring identical behavior across development and production environments.

Data flows via asynchronous HTTP requests from the React frontend to the FastAPI backend, which validates JWT tokens, interacts with PostgreSQL via SQLAlchemy, uploads/retrieves blobs from MinIO, and returns serialized JSON responses.

## 3. TECHNOLOGY STACK & LIBRARIES

### Backend
*   **FastAPI**: Used for its extreme performance (built on Starlette) and native Pydantic integration, providing automatic request validation and Swagger UI generation.
*   **SQLAlchemy & Alembic**: SQLAlchemy provides a secure, SQL-injection-resistant ORM. Alembic enables safe, version-controlled database schema migrations.
*   **PostgreSQL**: Chosen for its ACID compliance and JSONB support, vital for storing flexible ledger metadata.
*   **MinIO**: Provides an S3-compatible API for isolated, scalable object storage.
*   **JWT & bcrypt**: JSON Web Tokens ensure stateless, scalable session management. bcrypt provides salted, slow-hashing for secure password storage.

### Frontend
*   **React & TypeScript**: React enables a modular, component-based UI. TypeScript catches type errors at compile-time, critically reducing runtime bugs in complex financial workflows.
*   **Vite**: Radically faster build tool and development server compared to Webpack.
*   **Axios**: Promise-based HTTP client with interceptor support for attaching JWTs seamlessly.
*   **React Router**: Enables client-side routing for an uninterrupted SPA experience.

### Infrastructure
*   **Docker & Nginx**: Docker guarantees reproducible environments. Nginx (often used alongside React) can serve static assets with high concurrency in production.

## 4. DATABASE DESIGN & TABLE LOGIC

*   **USERS**: Stores authentication credentials, encrypted passwords, roles (BANK, CORPORATE, AUDITOR, ADMIN), and a unique 6-character identifier. Governs system RBAC.
*   **TRADE_TRANSACTIONS**: Tracks trade metadata (amount, currency, status: PENDING, IN_PROGRESS, COMPLETED, DISPUTED) and explicitly links a buyer ID and seller ID.
*   **DOCUMENTS**: Stores file metadata, the S3 file key, and crucially, the SHA-256 hash. Used for subsequent integrity checks.
*   **LEDGER_ENTRIES**: The system's append-only audit trail. Each entry records the action, actor, timestamp, and a hash of the previous entry, forming an unbreakable cryptographic chain.
*   **RISK_SCORES**: Dynamic table persisting rule-based counterparty risk scores (0-100) and rationale. Enables transparent banking assessments.
*   **AUDIT_LOGS**: Dedicated to tracking administrative actions (login, user modification) ensuring even super-users are monitored.

## 5. ROLE-BASED ACCESS CONTROL (RBAC) LOGIC

The system enforces strict functionality silos:
*   **BANK**: The trusted orchestrator. Only banks can *create* trades, verifying that transactions are legitimate before Corporate entities are attached. Banks verify documents and manage the core lifecycle.
*   **CORPORATE**: Participates in assigned trades as either a buyer or seller. Meaning they upload required documents but cannot alter the underlying trade status (outside of initiating disputes). Subject to continuous risk scoring based on their actions.
*   **AUDITOR**: Has system-wide read-only access. Cannot create or edit any ledger data, guaranteeing unbiased transparency and oversight.
*   **ADMIN**: Manages user governance but is strictly tracked by the Audit Log to prevent shadow modifications.

*Note: The Bank is NOT a counterparty to the trade. The Bank acts as the financier and trusted third party mediating between the Corporate Buyer and Corporate Seller.*

## 6. TRADE WORKFLOW LOGIC

1.  **Bank Creates Trade**: A Bank user initiates the trade, selecting the corporate buyer and seller, moving the system to `PENDING`.
2.  **Documents Uploaded**: Corporate parties upload required bills of lading, invoices, etc.
3.  **Verification**: Bank (or system automation depending on configuration) verifies document hashes against the ledger.
4.  **Ledger Updates**: Status adjustments advance the trade to `IN_PROGRESS` and `COMPLETED`. Every change spawns a `LedgerEntry`.
5.  **Completion / Dispute**: The trade settles gracefully, or if a party reports an issue, transitions to `DISPUTED`.
6.  **Risk Update**: Disputes dynamically recalculate the offending party's risk score.

## 7. DOCUMENT VERIFICATION LOGIC

When a file is uploaded, the FastAPI service reads the binary buffer and computes a SHA-256 hash before flushing it to MinIO. The hash is saved to PostgreSQL.
During verification, the system:
1.  Retrieves the binary blob from MinIO.
2.  Recalculates the SHA-256 hash in memory.
3.  Compares the new hash string against the database hash.
4.  If they match, integrity is confirmed. If not, the file has been tampered with. This failure generates a critical compliance alert and severely degrades the uploader's risk score.

## 8. LEDGER & IMMUTABILITY LOGIC

The `LedgerService` utilizes an append-only design paradigm. No `UPDATE` or `DELETE` statements target the `ledger_entries` table.
When a new event occurs:
1.  The system calculates the hash of the *previous* record.
2.  The new record stores its metadata, the actor ID, and the previous record's hash.
3.  This hash chaining means if an SQL injection or rogue admin alters a historical record, its hash changes, instantly invalidating the chain for all subsequent entries. This guarantees compliance-grade traceability.

## 9. RISK SCORING ENGINE LOGIC

The Risk Engine utilizes a highly transparent, rule-based approach over opaque Machine Learning models. 
*   **Inputs**: The engine ingests document verification failures (highest penalty weight), involvement in disputed trades, and irregular ledger behavior.
*   **Process**: It algorithmically subtracts points from a perfect baseline score based on weighted penalizations.
*   **Triggers**: Changing a trade to `DISPUTED` or failing a document hash check immediately triggers a recalculation.
*   **Transparency**: The rationale for the score drop is persisted alongside the score, ensuring the Bank knows exactly *why* a corporate entity is risky.

## 10. API WORKFLOW & EVENT TRIGGERS

Business logic functions simultaneously trigger ledger generation:
*   `POST /trades` -> `TRADE_CREATED` ledger event.
*   `POST /documents/upload` -> `DOCUMENT_UPLOADED` ledger event.
*   `GET /documents/{id}/verify` -> `VERIFIED` ledger event.
*   `PUT /trades/{id}/status` -> Evaluates status; if 'disputed', triggers `RiskService.trigger_on_trade_status_change()`, recalculating the risk score.

## 11. SECURITY & COMPLIANCE DESIGN

*   **Authentication**: Stateless JWTs ensure horizontal scalability.
*   **Hashing**: bcrypt applies salt mechanisms defending against rainbow table attacks for passwords.
*   **Enforcement**: FastAPI Dependency Injection (`Depends(require_roles(["bank"]))`) intercepts unauthorized requests before controller execution.
*   **Secure File Access**: S3 presigned URLs (where applicable) or proxy streaming prevents direct public bucket exposure.
*   **Audit Logging**: The admin actions and generalized ledger guarantee an inescapable footprint for all system users, vital for financial sector operations.

## 12. FRONTEND ARCHITECTURE

*   **Structure**: Features a Context-based React application mapping states like User Identity.
*   **Dashboards**: Router conditions render entirely different UI component trees (`<BankDashboard />` vs `<AuditorLedgerPage />`) based on the JWT role payload.
*   **Integration**: Custom Axios instances intercept responses; a 401 Unauthorized triggers an automatic logout and redirect.
*   **State**: Localized component state limits global re-renders, preventing sluggish UI feedback during massive ledger table sorting.

## 13. SYSTEM JOBS & AUTOMATION

The `scheduler.py` module utilizes internal timed jobs (e.g., via `APScheduler`) to execute background validation loops. It routinely retrieves random or high-risk document samples, recalculates their hashes, and logs automated system verifications without manual Auditor intervention, maintaining continuous system health checks.

## 14. DEPLOYMENT & INFRASTRUCTURE

The system is delivered via `docker-compose`. The architecture includes:
*   A base `postgres` container with persistent volume mounts.
*   A `minio` container mirroring AWS S3 architecture.
*   The `backend` running on an ASGI Uvicorn server.
*   The `frontend` serving the React bundle.
In production, this translates seamlessly to Kubernetes deployments (Pod per service) with managed AWS RDS and AWS S3 substituting the localized containers.

## 15. SCALABILITY & PERFORMANCE

*   **Service Layer**: Separating routing from logic (`BankService`, `LedgerService`) allows background workers (like Celery) to invoke core logic without needing mocked HTTP objects.
*   **Horizontal Scaling**: The stateless JWT backend can scale to infinite replicas behind an NGINX load balancer.
*   **Database**: Heavy queries (like fetching the Ledger) employ `skip` and `limit` for strict database-level pagination, mitigating memory-exhaustion on endpoints.

## 16. REAL-WORLD USE CASES

*   **Fraud Prevention**: Detects forged Bills of Lading in Letters of Credit execution by immediately identifying manipulated file blobs.
*   **Compliance Automation**: Replaces months of manual transaction trace auditing with real-time, algorithmic ledger queries.
*   **Banking Risk Monitoring**: Provides credit issuers with dynamically shifting counterparty profiling, preventing loans against shell companies or frequent default entities.
