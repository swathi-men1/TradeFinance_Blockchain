# 🚢 Trade Finance Blockchain Explorer (ChainDocs)

---

## 📖 Overview

Trade Finance Blockchain Explorer (ChainDocs) is a secure, web-based prototype designed to manage and track trade finance documents such as Invoices, Trade Contracts, and Shipping Documents.

This project demonstrates how "blockchain-inspired concepts" like cryptographic hashing and ledger-based audit trails can enhance "transparency, integrity, and traceability" in trade finance workflows.

Developed as part of the **Infosys Springboard Internship Program**.

---

 ### 👩‍💻 Developer Information

- **Developer:** Ughasri P, Lakshmi Chetana Pathipaka, Karuparty Meghana 
- **Internship Program:** Infosys Springboard  
- **Duration:** 8 Weeks  
- **Project Type:** Academic / Internship Prototype  
- **Status:** ✅ Completed  

---

### ❗ Problem Statement

Trade finance transactions involve multiple stakeholders and high-value documents.  
Traditional systems are often paper-based, error-prone, and lack transparency, making document verification and auditing difficult.

A secure digital system is required to:
- Manage trade documents efficiently  
- Track transaction history  
- Ensure document authenticity  
- Provide tamper-evident audit records  

---

### 🎯 Objectives

- Digitize trade finance document management  
- Ensure document integrity using cryptographic hashing  
- Maintain a ledger-style audit trail  
- Simulate blockchain principles like immutability and transparency  
- Provide a simple dashboard-style user interface  
- Demonstrate real-world application of emerging technologies  

---

 ### 🛠️ Technology Stack

### 🔹 Frontend
- HTML  
- CSS  
- JavaScript  

### 🔹 Backend (Future Scope)
- Python (Flask / FastAPI)

### 🔹 Database (Future Scope)
- SQLite / PostgreSQL  

### 🔹 Blockchain Concepts Used
- SHA-256 Hashing  
- Ledger-based Audit Logging  

---

## 🔐 Security & Integrity Concepts

### 📄 Document Integrity
- Each uploaded document generates a **SHA-256 hash**
- Hash values are stored for verification
- Any modification results in a hash mismatch, indicating tampering

### 📜 Audit Trail
- All critical actions are logged in an append-only ledger:
  - Trade creation  
  - Document uploads  
  - Status updates  
  - Verification activities  

This ensures **full transparency and traceability**.

---

## 👥 User Roles (Prototype Level)

### 🏢 Corporate User
- Create trade transactions  
- Upload trade-related documents  
- View their own trades and documents  

### 🏦 Bank User
- View and verify trade documents  
- Update trade status  
- Review ledger history  

### 🧾 Auditor
- Read-only access  
- View all trades, documents, and audit logs  

### ⚙️ Admin (Conceptual)
- Monitor system activity  
- Manage users and records  

---

## ⭐ Key Features

### 1️⃣ Trade Creation
- Create trades with seller, product, quantity, and price  
- Each trade represents a trade finance transaction  

### 2️⃣ Document Upload
- Upload documents such as:
  - Invoice  
  - Trade Contract  
  - Shipping Documents  
- Documents are linked to a unique Trade ID  

### 3️⃣ Ledger-Based Audit Logging
- Append-only ledger records all major actions  
- Provides a clear view of the trade lifecycle  

### 4️⃣ Trade Status Tracking
- Trade status progression:
  - Pending  
  - Approved  
  - Completed  

---

## 📄 Documents Used

- Invoice  
- Trade Contract  
- Shipping Documents (Sample representation)

These documents demonstrate a complete trade finance workflow.

🗂️ Project Structure
```text
TRADE FINANCE BLOCKCHAIN EXPLORER
│
└── Trade
    │
    ├── .vscode
    │   └── launch.json
    │
    ├── backend
    │   ├── __pycache__
    │   ├── chaindocs.db
    │   ├── database.py
    │   ├── main.py
    │   └── models.py
    │
    ├── admin.html
    ├── admin.js
    ├── blocks.html
    ├── image.png
    ├── CONTRACT.docx
    ├── CONTRACT.pdf
    ├── create_trade.html
    ├── dashboard.html
    ├── index.html
    ├── INVOICE-2.docx
    ├── INVOICE-2.pdf
    ├── INVOICE.docx
    ├── INVOICE.pdf
    ├── ledger.html
    ├── login.html
    ├── README.md
    ├── risk_utils.py
    ├── risk.html
    ├── SHIPPING.docx
    ├── SHIPPING.pdf
    ├── signin.js
    ├── signup.html
    ├── signup.js
    ├── trade.css
    ├── upload_document.html
    ├── verify.html
    └── view_trades.html
---
