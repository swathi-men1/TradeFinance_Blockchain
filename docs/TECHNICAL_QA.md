# Technical Q&A Guide

This document provides structured questions and answers commonly discussed during technical reviews, mentor demos, and viva sessions.

## SYSTEM ARCHITECTURE

**Q: Why was FastAPI chosen for the backend?**
A: FastAPI was chosen for its high performance, native support for asynchronous programming, and automatic generation of interactive API documentation (Swagger UI). Its integration with Pydantic ensures robust data validation and type safety out of the box.

**Q: Why is PostgreSQL used as the database?**
A: PostgreSQL provides strong ACID compliance, robustness, and excellent support for JSONB data types, which is crucial for storing flexible metadata in our ledger entries. It forms a reliable foundation for financial tracking and ensuring referential integrity across the system.

**Q: How does the React + TypeScript combination improve system reliability?**
A: TypeScript introduces static typing to React, reducing runtime errors by catching type mismatches during development. This is especially important in a financial application where understanding exact data structures (like `TradeTransaction` and `LedgerEntry`) prevents costly bugs and improves maintainability.

**Q: Why is Docker used?**
A: Docker containerizes the application, ensuring consistency across development, testing, and production environments. It simplifies deployment by bundling the backend, frontend, database, and storage services together, preventing "it works on my machine" issues.

## BLOCKCHAIN-INSPIRED LEDGER

**Q: Why is the ledger append-only?**
A: An append-only ledger mimics blockchain properties by ensuring that once an event (e.g., document upload, trade status change) is recorded, it cannot be modified or deleted. This guarantees a cryptographic, tamper-proof audit trail for compliance and dispute resolution.

**Q: How do hash chains prevent tampering?**
A: Each ledger entry includes the cryptographic hash of the previous entry. If an attacker attempts to alter a historical record, the hash of that entry changes, invalidating the hashes of all subsequent entries. This makes unauthorized modifications instantly detectable.

**Q: What is the difference between a traditional blockchain and this ledger?**
A: A traditional blockchain is decentralized and distributed across multiple independent nodes with consensus mechanisms (like Proof of Work). This system uses a centralized, cryptographically secured append-only ledger. It provides immutability and auditability suitable for a controlled enterprise environment without the computational overhead of distributed consensus.

## DOCUMENT VERIFICATION

**Q: Why is SHA-256 hashing used for documents?**
A: SHA-256 is a cryptographic hashing algorithm that acts as a digital fingerprint for a file. Even a single bit change in a document will produce a completely different SHA-256 hash.

**Q: What happens if a document is altered after upload?**
A: If a document is altered in storage, its new hash will not match the original hash recorded in the immutable ledger at the time of upload. The system’s integrity check will fail, flag the document, and trigger a critical compliance alert for the Auditor.

**Q: How is integrity verified in the system?**
A: The system retrieves the document from the secure storage (MinIO/S3), recalculates its SHA-256 hash, and compares it against the original hash stored in the database/ledger. If they match, the document is authentic.

## TRADE WORKFLOW

**Q: Who creates trades and why?**
A: Only the **Bank** role can create trades between corporate parties. This ensures trades are initiated by a trusted financial institution that oversees the transaction, mitigating fraud from the start.

**Q: What is the role of Bank users versus Corporate users?**
A: 
- **Bank**: Facilitates trades, verifies documents, monitors risk, and updates trade lifecycle stages.
- **Corporate**: Participates in trades as buyers or sellers, uploads required supporting documents, and tracks the progress of their specific transactions.

**Q: What are the trade lifecycle stages?**
A: Trades progress through a standardized workflow: `PENDING` → `IN_PROGRESS` → `COMPLETED`. If an issue arises at any point, a trade can be marked as `DISPUTED`. 

## RISK SCORING ENGINE

**Q: Why is rule-based scoring used?**
A: Rule-based scoring provides transparent, explainable risk assessments. In financial auditing, it is critical to know exactly *why* a party was flagged as HIGH risk. Machine learning models can sometimes act as "black boxes," which complicates compliance reporting.

**Q: Why does document integrity have the highest weight in the score?**
A: Forgery or tampering of trade documents (like Bills of Lading) is a primary vector for trade finance fraud. Hash mismatches strongly indicate malicious activity, immediately severely penalizing the user's risk score.

**Q: What triggers a risk recalculation?**
A: Risk scores are dynamic and recalculate based on system events, such as a trade becoming disputed, a document failing an integrity check, or the sudden accumulation of multiple compliance alerts.

**Q: How do disputes affect risk?**
A: Being involved as a seller in a disputed trade signals potential non-delivery or contract breach. The system detects this pattern and increases the counterparty's risk score accordingly, warning banks before future credit issuance.

## SECURITY & COMPLIANCE

**Q: How does JWT authentication work?**
A: Upon login, the server issues a JSON Web Token (JWT) containing the user's encoded identity and role. The client includes this token in the header of subsequent API requests. The server cryptographically verifies the signature to authorize the request statelessly.

**Q: How is Role-Based Access Control (RBAC) enforced?**
A: RBAC is enforced at the API layer using FastAPI dependencies that check the user's role in the JWT against allowed roles for a specific endpoint (e.g., only Auditors can fetch full compliance reports). It is also enforced in the React frontend to hide or show navigation links and action buttons based on the user's permissions.

**Q: How do audit logs ensure compliance?**
A: The system automatically records critical actions (e.g., logins, data modifications, status changes) with a timestamp, actor ID, and action details. Auditors can review these logs to ensure users are acting within permitted bounds and to trace the origin of any administrative changes.

## PERFORMANCE & SCALABILITY

**Q: How does the system scale horizontally?**
A: Because the backend is stateless (authentication via JWT and no in-memory session locking), multiple instances of the FastAPI server can run behind a load balancer to handle increased traffic. Storage scales seamlessly via S3/MinIO, and PostgreSQL connections can be pooled.

**Q: Why does the service layer architecture help?**
A: Separating business logic (Services) from HTTP routing (API endpoints) and database models makes the code modular. It allows developers to reuse logic (e.g., the Auditor Service can call the Ledger Service) and makes unit testing significantly easier.

## REAL-WORLD APPLICATION

**Q: How does this system prevent fraud?**
A: It prevents fraud through a layered approach: restricted trade creation (Banks only), immutable cryptographic proof of document originality (SHA-256 hashes), automated monitoring of erratic behavior (Risk Engine), and a transparent, tamper-evident audit trail (Ledger).

**Q: How can banks use it in trade finance?**
A: Banks can use this platform to securely digitalize Letters of Credit and supply chain financing. It mitigates the risk of financing against forged invoices and provides real-time visibility into the transaction lifecycle, reducing manual verification overhead and improving trust.
