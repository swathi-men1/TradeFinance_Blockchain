# Mentor Demo Explanation Guide

This guide provides a structured walkthrough for demonstrating the Trade Finance Blockchain Explorer. Use this flow to highlight key technical achievements, workflow enforcement, and security integrations.

## 1️⃣ SYSTEM INTRODUCTION (1 minute)

**Objective**: Set the stage and explain the value proposition.

* "Welcome to the Trade Finance Blockchain Explorer. This is a secure, role-based platform designed to digitalize and secure international trade transactions."
* "The core problem this system solves is trade document fraud and lack of transparency. We solve this by combining a cryptographic, append-only ledger with automated risk scoring and strict role-based access control."
* "Throughout this demo, you will see how different entities interact while the system automatically enforces compliance and maintains an immutable audit trail."

## 2️⃣ ROLE WORKFLOW EXPLANATION

**Objective**: Briefly explain the actors in the system before diving into the demo.

*   **Bank**: Acts as the trusted mediator. They create trades, manage the workflow, and assess risk before financing.
*   **Corporate (Buyer/Seller)**: Uploads documents, tracks transaction status, and participates in trades.
*   **Auditor**: Has a system-wide read-only view. They monitor the ledger, verify document integrity, and review compliance alerts.
*   **Admin**: Manages user accounts and oversees system health.

## 3️⃣ LIVE DEMO FLOW (STEP-BY-STEP)

### Step 1: Login & Dashboard overview (Bank User)
*   **Action**: Log in as a Bank user.
*   **Talking Point**: "Upon login, the Bank user sees a dashboard tailored to their role. Secure JWT authentication handles their session."

### Step 2: Create a Trade (Bank User)
*   **Action**: Navigate to Trade Transactions and create a new trade between two corporate entities.
*   **Talking Point**: "Notice that *only* the Bank can initiate trades. This is an architectural decision to prevent corporate entities from spoofing transactions."

### Step 3: Upload a Document (Corporate User)
*   **Action**: Log out, log in as a Corporate user (Seller). Upload a document (e.g., Bill of Lading).
*   **Talking Point**: "When the corporate user uploads this document, the backend immediately generates a SHA-256 cryptographic hash of the file and stores it."

### Step 4: Verify Document & Ledger (Auditor User)
*   **Action**: Log out, log in as an Auditor. Navigate to Document Management and run a Verification check.
*   **Talking Point**: "The Auditor can cryptographically verify documents. The system pulls the file from secure storage, recalculates the hash, and matches it against the ledger."
*   **Action**: Navigate to the System Ledger.
*   **Talking Point**: "Here is our append-only ledger. Every action we just took—trade creation, document upload, and verification—was logged automatically. Each entry contains the hash of the previous one, forming an immutable chain."

### Step 5: Risk Score & Compliance
*   **Action**: Navigate to the Risk Intelligence/Counterparty Risk page.
*   **Talking Point**: "The system continuously calculates risk. If a trade is disputed or a document hash fails validation, the Risk Engine automatically recalculates the score and alerts the bank. This provides proactive fraud prevention."

## 4️⃣ KEY POINTS TO HIGHLIGHT

During transitions, emphasize these technical pillars:

*   **Immutability**: "We don't use UPDATE or DELETE statements for ledger records. The audit trail is strictly append-only."
*   **Fraud Prevention**: "By anchoring document authenticity to SHA-256 hashes recorded at the exact moment of upload, backdating or modifying invoices is practically impossible."
*   **Compliance Transparency**: "Auditors don't have to request logs; the system provides a continuous, real-time mechanism to oversee the entire platform."
*   **Risk Monitoring**: "Risk isn't a static form; it's an algorithmic score determined by real-time behavioral and integrity markers."

## 5️⃣ COMMON QUESTIONS & SHORT ANSWERS

Use these quick responses if interrupted by mentor questions:

**Q: Is this an actual blockchain like Ethereum?**
A: "No, it is a centralized, blockchain-*inspired* ledger. It uses cryptographic hash chaining to guarantee immutability without the overhead of distributed consensus, which is more appropriate for a controlled banking environment."

**Q: Where are the files stored?**
A: "Files are stored in MinIO, an S3-compatible object storage system. Only the metadata and cryptographic hashes are stored in the PostgreSQL database."

**Q: What happens if an Admin tries to delete a trade?**
A: "We removed the delete functionality entirely from the backend endpoints. Once a trade is created, it can only be transitioned through allowed states (e.g., to 'Disputed' or 'Completed'), ensuring a permanent record."

**Q: How is the Risk Score calculated?**
A: "It's a rule-based engine. It starts at a baseline and applies penalties weighted by severity—for example, document hash mismatches apply a massive penalty, while a delayed shipment applies a minor one."
