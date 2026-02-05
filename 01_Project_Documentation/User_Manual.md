# User Manual: Trade Finance Blockchain Explorer
**Version:** 1.0  
**Author:** Abdul Samad (Student Developer)

---

## 1. Introduction
The **Trade Finance Blockchain Explorer** is a secure, ledger-based platform designed to digitize the trade finance lifecycle. It ensures transparency, immutability, and trust between Corporate entities, Banks, and Auditors using cryptographic hashing and a "Chain of Custody" model.

## 2. System Roles
The system enforces strict Role-Based Access Control (RBAC):

| Role | Responsibilities | Key Capabilities |
| :--- | :--- | :--- |
| **Corporate** | Buyers/Sellers | Upload Invoices/LoCs, Initiate Trades, View Own Risk Score. |
| **Bank** | Validator | Verify Documents, Settle Trades (Release Funds), View Global Risk Data. |
| **Auditor** | Oversight | Read-Only Access to all data. Manual Integrity Checks (Digital Watchdog). |
| **Admin** | System Manager | User Provisioning, System Health Monitoring. |

---

## 3. Operational Workflows

### 3.1 Corporate: Initiating a Trade
1.  **Login** as a Corporate User.
2.  **Upload Document**: Navigate to the "Documents" tab. Upload your Invoice or Letter of Credit (LoC).
    *   *Note: Providing a unique Document Number is mandatory.*
    *   *System Action: The file is hashed and registered in the Immutable Ledger.*
3.  **Create Trade**: Go to "Transactions" -> "New Trade".
    *   Select the uploaded document.
    *   Enter Counterparty (Buyer/Seller), Amount, and Currency.
    *   Click **Submit**.
    *   *Status: Pending Verification.*

### 3.2 Bank: Verifying & Settling
1.  **Login** as a Bank User.
2.  **Verification**: Go to the "Ledger" or "Documents" tab.
    *   Review the pending document.
    *   Click **Verify**.
    *   *Status: In Progress.*
3.  **Settlement**: Once funds are cleared off-platform:
    *   Navigate to the Trade details.
    *   Click **Settle Trade**.
    *   *System Action: Ledger records 'PAID'. Risk Scores are automatically updated.*

### 3.3 Auditor: Integrity Checking
1.  **Login** as an Auditor.
2.  **Digital Watchdog**: Navigate to any Document detail page.
3.  **Verify Integrity**: Click the **Verify File Hash** button.
    *   **Success**: "Integrity Confirmed."
    *   **Failure**: "TAMPERING DETECTED." (This will trigger a red alert across the system).

---

## 4. Key Features

### Risk Intelligence Engine
The system calculates a "Reliability Score" (0-100) for every Corporate user based on:
*   **Internal History (70%)**: Ratio of Completed vs. Disputed trades.
*   **External Data (30%)**: Simulated market stability index (WTO/BIS).

### Self-Healing Ledger
If a file in the secure vault is modified or corrupted:
1.  The system automatically detects the hash mismatch.
2.  The Ledger is "Stained" with a `SUSPECTED_TAMPERING` entry.
3.  All active trades linked to that document are immediately **LOCKED** to prevent financial loss.

---

## 5. Troubleshooting
*   **"Phantom Blocking"**: Ensure you are uploading documents under your own Organization. You cannot trade documents belonging to others.
*   **"Tamper Lock"**: If a trade is locked, contact the Auditor immediately. The document integrity has likely been compromised.

---
*Developed for MCA Final Internship Project.*
