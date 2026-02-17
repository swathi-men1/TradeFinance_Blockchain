# Trade Finance Blockchain - Complete Integration Guide

## System Overview

**Backend**: FastAPI (Python) - Port 8000
**Frontend**: React + Vite - Port 5176
**Database**: PostgreSQL - tradefinance
**Object Storage**: MinIO (for document files)

---

## Test Credentials

Use these credentials to log in and test all features:

### Bank User
- **Email**: bank@globalbank.com
- **Password**: password123
- **Role**: bank
- **Access**: View all trades, approve/reject pending trades

### Corporate User
- **Email**: corporate@techent.com
- **Password**: password123
- **Role**: corporate
- **Access**: View own trades, upload documents

### Auditor User
- **Email**: auditor@auditorpro.com
- **Password**: password123
- **Role**: auditor
- **Access**: Full audit trail, export data

### Admin User
- **Email**: admin@sysadmin.com
- **Password**: password123
- **Role**: admin
- **Access**: System administration, manage all records

---

## Architecture & Data Flow

### 1. Authentication Flow
```
Login Form → POST /auth/login → JWT Token → Stored in localStorage → Attached to all API requests
```

### 2. Trade Creation Flow (Bank User)
```
Create Trade Form → POST /trades?seller_id=X&amount=Y&currency=Z 
→ Creates trade with "pending" status
→ Creates blockchain ledger entry
→ Refreshes trades list
```

### 3. Trade Approval Flow (Bank User)
```
Click Approve → PUT /trades/{trade_id}/approve
→ Checks for documents
→ Checks for tampered documents
→ Updates status to "approved"
→ Creates ledger entry
```

### 4. Document Upload Flow (Corporate User)
```
Upload File → POST /documents/upload
→ File stored in MinIO
→ Calculate SHA256 hash
→ Store metadata in DB
→ Create ledger entry
```

### 5. Data Display Flow
```
Component mounts → Call GET /trades (role-filtered)
→ Parse response → Filter by status/search
→ Render in table format
```

---

## API Endpoints

### Authentication
- `POST /auth/login` - Login with email/password
- `POST /auth/signup` - Create new user

### Trades
- `POST /trades?seller_id=X&amount=Y&currency=Z` - Create trade (Bank only)
- `GET /trades` - List trades (role-filtered)
- `GET /trades/{id}` - Get specific trade
- `PUT /trades/{id}/approve` - Approve trade (Bank only)
- `PUT /trades/{id}/reject` - Reject trade (Bank only)

### Documents
- `POST /documents/upload` - Upload document (Corporate only)
- `GET /documents` - List documents
- `GET /documents/{id}` - Get specific document
- `POST /documents/{id}/verify` - Verify integrity

### Ledger
- `GET /ledger` - View blockchain ledger

### Export (Auditor/Admin only)
- `GET /export/trades/csv` - Export trades
- `GET /export/documents/csv` - Export documents
- `GET /export/ledger/csv` - Export ledger

---

## Dashboard Features

### Bank Dashboard
- ✅ View all trades (pending, approved, rejected)
- ✅ Create new trades
- ✅ Approve pending trades
- ✅ Reject pending trades
- ✅ View documents
- ✅ View ledger entries
- ✅ Search and filter trades

### Corporate Dashboard
- ✅ View own trades
- ✅ Upload documents
- ✅ View own documents
- ✅ Filter and search trades

### Auditor Dashboard
- ✅ View all trades
- ✅ View all documents
- ✅ View complete ledger
- ✅ Export data (CSV)
- ✅ Identify tampered documents

### Admin Dashboard
- ✅ View all documents
- ✅ View all trades  
- ✅ View organizations
- ✅ Delete documents
- ✅ System management

---

## Testing Checklist

### 1. Login Test
- [ ] Open http://localhost:5176
- [ ] Login as bank@globalbank.com / password123
- [ ] Verify redirects to /bank dashboard
- [ ] Check role badge shows "BANK" in header

### 2. Trade Creation Test
- [ ] Click "+ Create Trade" button
- [ ] Enter Counterparty ID (try: 2 for corporate user)
- [ ] Enter Amount: 50000
- [ ] Select Currency: USD
- [ ] Click "Create Trade"
- [ ] Verify success notification
- [ ] Check trade appears in Trades table

### 3. Trade Approval Test
- [ ] Find pending trade in table
- [ ] Click "Approve" button
- [ ] Verify success notification
- [ ] Check status changes to "Approved"

### 4. Document Upload Test
- [ ] Logout and login as corporate@techent.com / password123
- [ ] Navigate to Corporate Dashboard
- [ ] Click "+ Upload Document"
- [ ] Select a PDF or document file
- [ ] Click "Upload"
- [ ] Verify file appears in Documents table

### 5. Ledger Test
- [ ] View Ledger page
- [ ] Verify all actions appear (CREATE, APPROVE, UPLOAD, etc.)
- [ ] Check hash links are visible
- [ ] Verify timestamps and actors

### 6. Export Test
- [ ] Login as auditor@auditorpro.com / password123
- [ ] Click "Export Trades" button
- [ ] Verify CSV file downloads
- [ ] Check file contains expected data

---

## Troubleshooting

### Backend not responding
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend compilation errors
```bash
cd trade-frontend
npm run dev
```

### Database connection issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in backend/app/database.py
- Verify database "tradefinance" exists

### Login fails
- Verify seed data was created: `python backend/seed_data.py`
- Check user email matches exactly (case-sensitive)
- Verify password is "password123"

---

## File Structure

### Key Frontend Files
- `src/pages/BankDashboard.jsx` - Bank trade management
- `src/pages/CorporateDashboard.jsx` - Corporate document upload & trading
- `src/pages/AuditorDashboard.jsx` - Audit trails and export
- `src/pages/AdminDashboard.jsx` - Admin system management
- `src/api/axios.js` - API client configuration
- `src/context/AuthContext.jsx` - Authentication state management

### Key Backend Files
- `app/routes/trades.py` - Trade CRUD endpoints
- `app/routes/documents.py` - Document upload/management
- `app/routes/auth.py` - Login/signup endpoints
- `app/routes/ledger.py` - Blockchain ledger endpoints
- `app/utils/rbac.py` - Role-based access control
- `app/models/` - Database models

---

## Features Summary

✅ Role-based access control (Admin, Bank, Corporate, Auditor)
✅ Trade creation and management
✅ Document upload with tamper detection
✅ Blockchain ledger tracking
✅ SHA256 hash verification
✅ Data export (CSV format)
✅ User authentication (JWT)
✅ Responsive UI with Tailwind CSS
✅ Real-time data filtering and search
✅ Complete API integration
