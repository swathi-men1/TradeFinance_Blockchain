# Trade Finance Blockchain Project

## Project Overview

This project is a **Trade Finance Management System** built using Django.
It provides a role-based platform where different users such as **Admin, Bank, Corporate, and Auditor** can manage trade-related activities securely.
The system simulates a blockchain-style workflow where trade documents, transactions, ledger data, and risk analysis are handled through structured modules.
The main goal of this project is to improve transparency, monitoring, and management of trade finance operations.

---

## Features

* Role-based authentication system
* Admin approval and user role management
* Trade document handling
* Ledger tracking module
* Risk monitoring module
* Transaction tracking
* Dashboard with dynamic module visibility
* Secure login system


## User Roles & Flow

### 🔹 Admin

* Approves users
* Assigns roles
* Access to all modules

### 🔹 Corporate

* Uploads and manages trade documents
* Views risk analysis

### 🔹 Bank

* Verifies trades
* Accesses ledger and transactions

### 🔹 Auditor

* Monitors risk and trade activities

---

## Technologies Used

* Python
* Django Framework
* HTML / CSS
* SQLite (for deployment)

---

## How to Run the Project (Local Setup)

### 1️⃣ Clone the Repository

git clone https://github.com/swathi-men1/TradeFinance_Blockchain.git
cd TradeFinance_Blockchain

### 2️⃣ Install Dependencies

pip install -r requirements.txt

### 3️⃣ Apply Migrations

python manage.py migrate

### 4️⃣ Create Superuser

python manage.py createsuperuser

### 5️⃣ Run Server

python manage.py runserver

Open in browser:

http://127.0.0.1:8000/

---

## 🌐 Live Deployment

The project is deployed on Render:

https://trade-finance-blockchain.onrender.com/

---

## How to Use the Project

1. Register a new user account.
2. Admin approves the user and assigns a role.
3. Login using your credentials.
4. Based on your role, different modules will be visible:

   * Documents
   * Ledger
   * Risk Analysis
   * Transactions
5. Perform actions according to your role permissions.

---

## Project Structure

```
blockchainexp/
users/
documents/
ledger/
risk/
transactions/
templates/
static/
```

---

## Notes

* Profiles are automatically created for new users.
* Role-based dashboard ensures controlled access to modules.
* SQLite is used for deployment compatibility.

---

## Conclusion

This project demonstrates a role-based trade finance system built using Django, focusing on workflow transparency, user authorization, and modular financial management.
It showcases backend development skills, database handling, and real-world application architecture.

---
