# Trade Finance Blockchain API

A secure backend system that simulates a **Blockchain-based Trade Finance platform** for managing trade transactions, document integrity, ledger tracking, risk analysis, and analytics.

This project demonstrates how blockchain concepts can be applied to trade finance workflows to improve transparency, traceability, and fraud prevention.

---

## 🚀 Project Overview

The Trade Finance Blockchain API enables:

- Secure trade creation between buyers and sellers
- Document integrity verification using hashing
- Immutable ledger logging (blockchain-style)
- Risk scoring for users
- Analytics dashboard insights
- Role-based authentication using JWT

The system mimics a blockchain audit trail where every activity is permanently recorded.

---

## 🏗️ Tech Stack

- **Backend:** FastAPI (Python)
- **Authentication:** JWT Token-based Auth
- **Architecture:** Modular Service-Based Design
- **Blockchain Concept:** Hash-linked Ledger Entries
- **API Documentation:** Swagger UI
- **Version Control:** Git & GitHub

---

## 📂 Project Structure

backend/
│
├── app/
│ ├── main.py
│ ├── models/
│ ├── routes/
│ │ ├── auth.py
│ │ ├── trades.py
│ │ ├── documents.py
│ │ ├── ledger.py
│ │ ├── risk.py
│ │ └── analytics.py
│ ├── services/
│ └── utils/
│
└── requirements.txt

---

## 🔐 Features Implemented

### 1️⃣ Authentication
- JWT-based login system
- Role-based access control
- Supported Roles:
  - BUYER
  - CORPORATE
  - BANK (extendable)

---

### 2️⃣ Trade Management
- Create trade transactions
- Buyer–Seller workflow
- Automatic ledger recording

Endpoint:
POST /trades/create

---

### 3️⃣ Document Integrity Verification
- Upload trade documents
- SHA hashing for integrity
- Tamper detection mechanism

Endpoints:
POST /documents/upload-document
POST /documents/{doc_id}/verify-integrity

---

### 4️⃣ Blockchain-style Ledger
- Every action stored as immutable entry
- Hash chaining between records
- Full audit trail

Endpoint:
GET /ledger/{document_id}

---

### 5️⃣ Risk Analysis Engine
- Dynamic user risk calculation
- Updated after each trade

Endpoint:
GET /risk/user/{username}

---

### 6️⃣ Analytics Dashboard
- Trade statistics overview
- System activity insights

Endpoint:
GET /analytics/overview

---

## ⚙️ Installation & Setup

### Step 1 — Clone Repository

```bash
git clone https://github.com/swathi-men1/TradeFinance_Blockchain.git
cd TradeFinance_Blockchain/backend
Step 2 — Create Virtual Environment
python -m venv venv
source venv/bin/activate   # macOS/Linux
Step 3 — Install Dependencies
pip install -r requirements.txt
Step 4 — Run Server
uvicorn app.main:app --reload
Server runs at:
http://127.0.0.1:8000
📘 API Documentation
Swagger UI:
http://127.0.0.1:8000/docs
🔑 Demo Credentials
Role	Username	Password
Buyer	buyer	buyer123
Corporate	corporate1	corporate123
🔄 Workflow
Login → Receive JWT Token
Upload Document
Create Trade
Ledger Entry Generated
Risk Score Updated
View Analytics

🧪 Screenshots / Demo



🌐 Deployment Link


⚠️ Current Limitations
Uses in-memory database (no persistent storage)
Simplified blockchain simulation
No smart contract execution layer
Limited user roles
🔮 Future Enhancements
Real blockchain integration (Hyperledger / Ethereum)
Database persistence (PostgreSQL)
Smart contracts
Frontend dashboard
Trade approval workflows


📌 Project Purpose
This project was developed as part of a Virtual Internship Project Demo for Infosys, showcasing blockchain concepts applied to financial systems.


✅ Status
✔ Development Complete
✔ Demo Ready
✔ API Tested