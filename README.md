# TradeChain - Trade Finance Blockchain Explorer

## Overview
TradeChain is a simplified blockchain-inspired platform designed to modernize trade finance. By providing a secure, transparent, and immutable ledger for documents and transactions, it helps reduce fraud, improve visibility, and streamline the trade process for Buyers, Sellers, and Banks.

## Key Features
- **Role-Based Access Control (RBAC)**: Custom dashboards and permissions for Corporate (Buyer/Seller), Auditor, and Admin roles.
- **Secure Document Management**: Upload and track trade documents (Invoices, Bills of Lading) with SHA-256 hash-based integrity verification.
- **Immutable Ledger**: A transparent audit trail of all actions performed on documents and transactions.
- **Trade Transaction Flow**: Manage the full lifecycle of a trade—from issuance and shipping to receipt and payment.
- **Real-Time Analytics**: Visual insights into transaction statuses, document integrity, and risk scoring.

## Tech Stack
- **Backend**: FastAPI (Python)
- **Database**: SQLite (SQLAlchemy ORM)
- **Frontend**: Vanilla HTML5, CSS3, and JavaScript
- **Security**: JWT-based authentication and SHA-256 hashing

## How to Run (Using VS Code)

### Prerequisites
- [Python 3.8+](https://www.python.org/downloads/)
- [VS Code](https://code.visualstudio.com/)
- [Live Server Extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) (recommended for frontend)

### Step 1: Backend Setup
1. Open the project folder in VS Code.
2. Open a new Terminal (**Ctrl+Shift+`**).
3. Ensure you are in the root directory: `d:\501\Projects\Trade_Finance_Blockchain`.
4. Run the backend start script:
   ```powershell
   .\start_backend.ps1
   ```
   *Note: If you encounter a script execution error, run `Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process` once.*
5. The backend API will be running at `http://127.0.0.1:8001`. You can view the API documentation at `http://127.0.0.1:8001/docs`.

### Step 2: Frontend Setup
1. In the VS Code File Explorer, navigate to the `frontend/` folder.
2. Right-click on `index.html`.
3. Select **Open with Live Server**.
4. The application will open in your default browser (usually at `http://127.0.0.1:5500`).

## Usage Guide
1. **Signup**: Register a new account as a **Corporate** user (Buyer or Seller) or contact an Admin for other roles.
2. **Dashboard**: Navigate through the sidebar to view your Ledger, Analytics, and Documents.
3. **Transactions**: Use the "Trade Transactions" section to initiate and manage trade flows.
