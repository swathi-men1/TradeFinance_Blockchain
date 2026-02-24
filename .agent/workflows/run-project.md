---
description: How to run the TradeChain project
---

Follow these steps to run the TradeChain application locally.

### 1. Run the Backend
The backend is built with FastAPI. Use the provided helper script to start it correctly with the virtual environment.

// turbo
1. Open a PowerShell terminal in the project root (`d:\Trade_Finance_Blockchain (4)`).
2. Run the start script:
   ```powershell
   .\start_backend.ps1
   ```
   *Note: If you get a permission error, run `Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process` first.*

The backend will be available at `http://127.0.0.1:8000`.

### 2. Open the Frontend
The frontend consists of static HTML/CSS/JS files.

1. Navigate to the `Trade_Finance_Blockchain/frontend` directory.
2. Open `index.html` in your browser.
3. **Recommended**: Use the VS Code "Live Server" extension on `index.html` for the best experience (it usually runs on `http://127.0.0.1:5500`).

### 3. Usage Flow
1. **Signup**: Create an account as a **Buyer**, **Seller**, or **Bank**.
2. **Dashboard**: Access different features based on your role.
3. **Transactions**: Upload documents and watch them appear in the **Ledger**.
