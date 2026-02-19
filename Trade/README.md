# 🚢 Trade Finance Blockchain Explorer (ChainDocs)

> Internship Project | Infosys Springboard

---

## 📖 Overview

The **Trade Finance Blockchain Explorer (ChainDocs)** is a secure web-based application designed to manage and track trade finance documents and transactions such as **Invoices, Trade Contracts, and Shipping Documents**.

The project demonstrates how **blockchain-inspired concepts**—like cryptographic hashing and ledger-based audit trails—can be applied to trade finance to improve **transparency, integrity, and traceability**.

This project was developed as part of the **Infosys Springboard Internship Program**.

---

## 👩‍💻 Developer Information

- **Developer:** Lakshmi Chetana  
- **Program:** Infosys Springboard Internship  
- **Duration:** 8 Weeks  
- **Project Type:** Internship / Academic Prototype  
- **Status:** Completed  

---

## ❗ Problem Statement

Trade finance involves high-value, multi-party transactions that rely heavily on document authenticity. Traditional systems are often paper-based, lack transparency, and make auditing difficult.

There is a need for a digital system that can securely manage trade documents, track transaction history, and provide tamper-evident records.

---

## 🎯 Objectives

- Digitize trade finance document management  
- Ensure document integrity using cryptographic hashing  
- Maintain a ledger-style audit trail of activities  
- Simulate blockchain concepts such as immutability and transparency  
- Provide a dashboard-style user interface  
- Demonstrate real-world application of emerging technologies  

---

## 🛠️ Technology Stack

### Frontend
- HTML  
- CSS  
- JavaScript  

### Backend (Future Scope)
- Python (Flask / FastAPI)

### Database (Future Scope)
- SQLite / PostgreSQL

### Blockchain Concept
- SHA-256 hashing  
- Ledger-style audit logging  

---

## 🔐 Security & Integrity Concepts

### Document Integrity
- Each uploaded document generates a **SHA-256 hash**
- Hash values are used to verify document authenticity
- Any modification can be detected via hash mismatch

### Audit Trail
- All critical actions are recorded in a ledger:
  - Trade creation  
  - Document upload  
  - Status updates  
  - Verification actions  

This ensures transparency and traceability.

---

## 👥 User Roles (Prototype Level)

### Corporate User
- Create trade transactions  
- Upload trade-related documents  
- View their own trades and documents  

### Bank User
- View and verify trade documents  
- Update trade status  
- Review ledger history  

### Auditor
- Read-only access  
- View all trades, documents, and audit logs  

### Admin (Conceptual)
- Monitor system activity  
- Manage records and users  

---

## ⭐ Key Features

### 1. Trade Creation
- Create trades with seller, product, quantity, and price  
- Each trade represents a trade finance transaction  

### 2. Document Upload
- Upload documents such as:
  - Invoice  
  - Trade Contract  
  - Shipping Documents  
- Documents are linked to a trade ID  

### 3. Ledger-Based Audit Logging
- Append-only ledger records all major actions  
- Provides a clear trade lifecycle view  

### 4. Trade Status Tracking
- Trades move through statuses:
  - Pending  
  - Approved  
  - Completed  

---

## 📄 Documents Used

- Invoice  
- Trade Contract  
- Shipping Documents (sample representation)  

These documents are sufficient to demonstrate the trade finance workflow.

---

## 🗂️ Project Structure

