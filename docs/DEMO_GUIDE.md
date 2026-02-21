# Demo & Presentation Guide — Trade Finance Blockchain Explorer

This guide is structured for two audiences: **Mentor/Viva demos** and **formal presentations**. Use whichever section fits your context.

---

## 🎯 Opening Statement (30–60 seconds)

Use this to open any presentation or demo:

> *"Welcome to the Trade Finance Blockchain Explorer. International trade finance today is plagued by paper-based inefficiencies, opaque credit profiling, and multi-million dollar document tampering fraud. This platform eliminates those vulnerabilities. It provides a zero-trust, role-based ecosystem where trades are orchestrated exclusively by banks, document integrity is mathematically proven using SHA-256 cryptography, and counterparty risk is algorithmically monitored in real time using a blockchain-inspired immutable ledger."*

---

## 👥 The Four Roles — Quick Explanation

Before the demo, briefly introduce the actors:

| Role | Responsibility |
|---|---|
| **Bank** | Trusted mediator. Creates trades, verifies documents, manages lifecycle, assesses risk. |
| **Corporate (Buyer/Seller)** | Trade participant. Uploads documents, tracks status, raises disputes. |
| **Auditor** | System-wide read-only. Monitors ledger, verifies document integrity, reviews compliance alerts. |
| **Admin** | Governs user accounts, manages platform health, monitored by Audit Logs. |

> Note: The **Bank is NOT a counterparty** to the trade. It acts as the trusted financier and mediator between the Corporate Buyer and Corporate Seller.

---

## 🖥️ Live Demo Flow (Step-by-Step)

Follow this exact sequence to tell a complete, compelling story.

### Step 1 — Bank Login & Dashboard

- **Action**: Log in as a Bank user.
- **Say**: *"Upon login, the Bank user sees a dashboard tailored to their role, summarizing active trades, pending verifications, and high-risk counterparties detected by the system. Secure JWT authentication handles their session statelessly — no session table lookups on each request."*

### Step 2 — Create a Trade (Bank)

- **Action**: Navigate to Trade Management → Initiate a Trade. Assign a Corporate Buyer and Seller.
- **Say**: *"Notice that only the Bank can initiate trades. This is an intentional architectural restriction. Corporate accounts cannot fabricate trading history to artificially inflate their credit reliability in the system."*

### Step 3 — Upload a Document (Corporate Seller)

- **Action**: Log out, log in as a Corporate Seller. Navigate to the active trade and upload a Bill of Lading.
- **Say**: *"The moment this file uploads, the backend reads the binary data, computes a SHA-256 cryptographic fingerprint, stores the file securely in object storage, and permanently records the hash in the database. This happens atomically — the data and its proof of authenticity are cemented simultaneously."*

### Step 4 — Raise a Dispute (Corporate)

- **Action**: Initiate a Dispute on the trade.
- **Say**: *"In the real world, shipments fail or goods are damaged. Marking a trade as Disputed immediately pauses the workflow, alerts the bank, and automatically triggers our Risk Engine to recalculate the seller's counterparty risk score."*

### Step 5 — Auditor Review & Verification

- **Action**: Log out, log in as the Auditor. Navigate to Counterparty Risk.
- **Say**: *"Because a dispute was raised, the Risk Engine immediately penalized the seller's score based on our weighted formula. The Auditor can see exactly why — we deliberately avoid machine learning 'black boxes' in favor of transparent, explainable rule-based scoring."*
- **Action**: Navigate to Document Management → click Verify on the uploaded document.
- **Say**: *"The system just pulled the document from secure storage, mathematically recalculated its SHA-256 fingerprint, and matched it against the immutable hash recorded at the exact second it was uploaded. We just cryptographically proved this document has not been tampered with."*

### Step 6 — The Immutable Ledger

- **Action**: Navigate to the System Ledger.
- **Say**: *"This ledger is the core of the system. Every action we just took — trade creation, document upload, dispute, verification — was automatically logged here. Each entry carries the hash of the previous one, forming a chain. If a rogue administrator modifies a historical record in the database, its hash changes and invalidates every subsequent entry. The entire chain breaks visibly and instantly."*

---

## 🔑 Key Pillars to Emphasize During Transitions

Reference these throughout the demo to reinforce the technical depth:

- **Immutability**: *"We use no UPDATE or DELETE statements anywhere in the ledger code."*
- **Document Fraud Prevention**: *"Changing even a single byte in a 500-page PDF produces an entirely different SHA-256 hash, making backdated invoices immediately detectable."*
- **Compliance Transparency**: *"Auditors don't request logs — the system provides a continuous, real-time, mathematically verifiable audit trail."*
- **Risk Monitoring**: *"Risk isn't a static form — it's an algorithmic score driven by real-time events like disputes and hash failures."*
- **Role Security**: *"Stateless JWTs contain the role payload. FastAPI dependency injection blocks unauthorized requests before any controller logic executes."*

---

## ❓ Common Questions & Confident Answers

**Q: Is this an actual blockchain like Ethereum or Hyperledger?**
> *"No. A public blockchain achieves immutability through distributed consensus across thousands of independent nodes. This is expensive and slow. We implement the core security property of blockchain — cryptographic hash chaining — on a centralized, high-performance database. This gives us enterprise-grade audit trail immutability with banking-grade throughput, without the energy and latency costs of distributed consensus."*

**Q: Why is SHA-256 used for documents?**
> *"SHA-256 is a one-way cryptographic function that produces a unique 256-bit fingerprint for any input. Even changing a single period to a comma in a 500-page PDF produces an entirely different hash. This means document forgery is mathematically detectable at the byte level."*

**Q: Why do only Banks create trades?**
> *"To prevent corporate 'shell' accounts from fabricating trading history to artificially inflate their credit reliability inside the system. The Bank serves as the single trusted source of truth for trade initiation."*

**Q: How is the Risk Score calculated exactly?**
> *"It's a transparent weighted formula: Final Score = (Document Integrity × 40%) + (Ledger Behavior × 25%) + (Transaction Behavior × 25%) + (External Risk × 10%). Each component drops from a perfect 1.0 baseline when specific events occur. For example, a SHA-256 hash mismatch causes the Document Integrity component to drop sharply because it is the strongest indicator of fraud."*

**Q: What happens if an Admin tries to delete a trade?**
> *"We removed the delete endpoints entirely from the backend. Once a trade exists, it can only be transitioned through defined states. There is no API surface for deletion, which guarantees a permanent, tamper-proof record."*

**Q: Where are the files physically stored?**
> *"Files are stored in Supabase Storage (S3-compatible object storage) in production, or MinIO locally. Only the metadata and the SHA-256 hash are stored in PostgreSQL. This keeps the relational database lean while the object store handles binary scale."*

---

## 💡 Presentation Confidence Tips

- **Explain clearly, avoid jargon**: Instead of *"We query the DB for the JWT sub"*, say *"The system securely identifies who is accessing the data."*
- **Emphasize real-world value**: Keep reminding the audience *why* this matters. *"This prevents banks from financing against a forged invoice."*
- **Show workflow, not code**: Do not open the IDE unless specifically asked to prove an implementation. Let the UI tell the story.
- **Highlight transparency constantly**: Click "View Rationale" or "View Timeline" whenever possible to prove the system hides nothing from stakeholders.
