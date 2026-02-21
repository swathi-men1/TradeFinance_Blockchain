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

<img width="642" height="437" alt="Screenshot 2026-02-20 at 10 53 38 PM" src="https://github.com/user-attachments/assets/8ecb1ae2-8bda-43ad-983b-92a7effea5b0" />


<img width="1440" height="825" alt="Screenshot 2026-02-20 at 10 54 52 PM" src="https://github.com/user-attachments/assets/1bb3b4c5-dc42-4bcd-9774-9351d6dcf422" />
<img width="220" height="349" alt="Screenshot 2026-02-20 at 10 52 14 PM" src="https://github.com/user-attachments/assets/d13594e5-6b17-4506-85d2-c1d2401518c8" />
<img width="422" height="241" alt="Screenshot 2026-02-20 at 10 51 41 PM" src="https://github.com/user-attachments/assets/dd36fe46-f2d8-49c2-9bfd-c0b9ec158ffa" />
<img width="1438" height="783" alt="Screenshot 2026-02-20 at 10 54 38 PM" src="https://github.com/user-attachments/assets/30fb2b31-9a9c-42b1-866d-06f27ce35aa0" />
<img width="1440" height="787" alt="Screenshot 2026-02-20 at 10 51 21 PM" src="https://github.com/user-attachments/assets/9043d582-42cf-4837-91d8-e065bb75925f" />
<img width="802" height="398" alt="Screenshot 2026-02-20 at 10 51 07 PM" src="https://github.com/user-attachments/assets/619d4387-4d87-450f-9e90-4ff6dc934e4e" />
<img width="1417" height="794" alt="Screenshot 2026-02-20 at 10 50 42 PM" src="https://github.com/user-attachments/assets/442691ef-fa72-4df7-92c9-380ea623ba5f" />
<img width="1419" height="807" alt="Screenshot 2026-02-20 at 10 54 22 PM" src="https://github.com/user-attachments/assets/a384bb1a-2d77-4fc8-bd30-321ed90735d1" />
<img width="1440" height="819" alt="Screenshot 2026-02-20 at 10 53 49 PM" src="https://github.com/user-attachments/assets/37ded052-07ee-4658-b6ee-ab206be0f62f" />
<img width="642" height="437" alt="Screenshot 2026-02-20 at 10 53 38 PM" src="https://github.com/user-attachments/assets/b9273f72-2ff9-4a57-bc01-12ff4cea6ab4" />
<img width="746" height="578" alt="Screenshot 2026-02-20 at 11 25 23 PM" src="https://github.com/user-attachments/assets/f1caf813-9c59-4327-a10c-3f5d1ead7895" /><img width="995" height="540" alt="Screenshot 2026-02-20 at 10 53 03 PM" src="https://github.com/user-attachments/assets/f793d04c-fe45-4047-82bd-ae0c0a81da4e" />

## Deployment Link
https://tradefinance-blockchain.onrender.com


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
