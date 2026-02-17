# Trade Finance Blockchain System - Quick Start Guide

## ✅ Current Status

**Backend**: Running on http://localhost:8000
**Frontend**: Running on http://localhost:5176
**Database**: PostgreSQL with test data
**Test Credentials**: Ready

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Open the Application
```
Open your browser: http://localhost:5176
```

### Step 2: Login as Bank User
```
Email: bank@globalbank.com
Password: password123
```
You'll be redirected to the Bank Dashboard.

### Step 3: View Test Data
The dashboard shows:
- **Trades Table**: 3 test trades (pending, approved, and another pending)
- **Documents Table**: Documents uploaded
- **Ledger Table**: All blockchain entries
- **Quick Stats**: Summary numbers

### Step 4: Test Trade Creation
```
1. Click "+ Create Trade" button
2. Enter Counterparty ID: 2 (the corporate user)
3. Enter Amount: 75000
4. Select Currency: EUR
5. Click "Create Trade"
6. Verify success notification and new trade in table
```

### Step 5: Test Trade Approval
```
1. Find a "pending" trade in the Trades table
2. Click "Approve" button
3. Verify status changes to "approved"
4. Check ledger entry for this action
```

### Step 6: Test Trade Rejection
```
1. Create another trade (repeat Step 4)
2. Click "Reject" button
3. Verify status changes to "rejected"
```

### Step 7: Logout & Test Corporate User
```
1. Click your username in header → Logout
2. Login with:
   Email: corporate@techent.com
   Password: password123
3. You'll see Corporate Dashboard with your trades
```

### Step 8: Upload a Document (as Corporate)
```
1. Click "+ Upload Document"
2. Select any file from your computer (PDF, DOCX, etc.)
3. Click "Upload"
4. Verify file appears in Documents table
```

### Step 9: Test Auditor User
```
1. Logout → Login as: auditor@auditorpro.com / password123
2. View complete audit trail
3. Click "Export Trades" button to download CSV
4. Click "Export Documents" to download document list
```

### Step 10: Test Admin User
```
1. Logout → Login as: admin@sysadmin.com / password123
2. View all system data
3. Manage organizations and documents
```

---

## 📊 What Each Role Can Do

### Bank
| Action | Allowed |
|--------|---------|
| View all trades | ✅ |
| Create trades | ✅ |
| Approve trades | ✅ |
| Reject trades | ✅ |
| View documents | ✅ |
| Upload documents | ❌ |
| View ledger | ✅ |
| Export data | ❌ |

### Corporate
| Action | Allowed |
|--------|---------|
| View own trades | ✅ |
| Create trades | ❌ |
| Approve trades | ❌ |
| Upload documents | ✅ |
| View own documents | ✅ |
| View system ledger | ❌ |

### Auditor
| Action | Allowed |
|--------|---------|
| View all trades | ✅ |
| View all documents | ✅ |
| View complete ledger | ✅ |
| Export all data (CSV) | ✅ |
| Identify tampered docs | ✅ |
| Approve trades | ❌ |

### Admin
| Action | Allowed |
|--------|---------|
| View everything | ✅ |
| Manage documents | ✅ |
| Delete records | ✅ |
| Manage organizations | ✅ |
| View audit logs | ✅ |

---

## 🔧 All Features Implemented

### ✅ Authentication & Authorization
- [x] Login/Signup with JWT
- [x] Role-based access control
- [x] Persistent sessions
- [x] Logout functionality

### ✅ Trade Management
- [x] Create trades (Bank only)
- [x] View all trades (role-filtered)
- [x] Approve pending trades (Bank only)
- [x] Reject pending trades (Bank only)
- [x] Status tracking (pending, approved, rejected)
- [x] Tamper detection

### ✅ Document Management
- [x] Upload documents (Corporate only)
- [x] View documents (role-filtered)
- [x] SHA256 hash verification
- [x] Tamper detection
- [x] Document metadata storage

### ✅ Blockchain Ledger
- [x] Track all actions (CREATE, APPROVE, REJECT, UPLOAD, etc.)
- [x] SHA256 hash chaining
- [x] Immutable audit trail
- [x] Actor tracking (who did what)
- [x] Timestamp recording

### ✅ User Interface
- [x] Responsive design (Tailwind CSS)
- [x] Data tables with sorting/filtering
- [x] Search functionality
- [x] Status badges and indicators
- [x] Toast notifications
- [x] Loading spinners
- [x] Modal confirmations
- [x] Professional color scheme (blue/light-blue)

### ✅ Data Export
- [x] Export trades as CSV (Auditor/Admin)
- [x] Export documents as CSV (Auditor/Admin)
- [x] Export ledger as CSV (Auditor/Admin)

---

## 📋 API Endpoints (All Integrated)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/login` | User login |
| POST | `/auth/signup` | User registration |
| POST | `/trades` | Create new trade |
| GET | `/trades` | List trades (role-filtered) |
| PUT | `/trades/{id}/approve` | Approve trade |
| PUT | `/trades/{id}/reject` | Reject trade |
| POST | `/documents/upload` | Upload document |
| GET | `/documents` | List documents |
| GET | `/ledger` | View blockchain ledger |
| GET | `/export/trades/csv` | Export trades |
| GET | `/export/documents/csv` | Export documents |
| GET | `/export/ledger/csv` | Export ledger |

---

## 🐛 If Something Doesn't Work

### Check Backend Status
```bash
# Window/Terminal 1
cd c:\project\TradeFinance_Blockchain\backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Check Frontend Status
```bash
# Window/Terminal 2
cd c:\project\TradeFinance_Blockchain\trade-frontend
npm run dev
```

### Reset Test Data
```bash
cd c:\project\TradeFinance_Blockchain\backend
python seed_data.py
```

### Common Issues & Solutions

**Issue**: Login fails
- **Solution**: Check seed_data.py was run successfully
- Verify email matches exactly: `bank@globalbank.com`

**Issue**: Tables show no data
- **Solution**: Refresh the page (F5)
- Check browser console for errors (F12)
- Verify backend is running

**Issue**: Create Trade button does nothing
- **Solution**: Check that Counterparty ID exists (try ID: 2)
- Check browser console for API errors

**Issue**: Document upload fails
- **Solution**: Ensure file is not too large (< 50MB)
- File must be a valid document format

**Issue**: Export buttons don't work
- **Solution**: You must be logged in as Auditor or Admin
- Check that backend is running

---

## 💾 Database

The test database includes:
- **4 Organizations**: Bank, Corporate, Auditor, Admin
- **4 Pre-created Users**: One for each role
- **3 Test Trades**: With various statuses
- **Ledger Entries**: Log of all actions

To reset everything:
```bash
# This will clear and recreate all test data
python seed_data.py
```

---

## 🎯 Next Steps

1. **Test Complete Flow**:
   - Login → Create Trade → Approve → View in Ledger

2. **Test Role Segregation**:
   - Try accessing unauthorized features
   - Verify 403 Forbidden errors

3. **Test Data Export**:
   - Export data as CSV
   - Open in Excel

4. **Test Error Handling**:
   - Try invalid Counterparty IDs
   - Try uploading invalid files
   - Observe error messages

5. **Production Deployment**:
   - Update CORS settings
   - Use environment variables
   - Set up proper database backup

---

## 📞 Support Information

**Frontend**: React 19 + Vite + Tailwind CSS
**Backend**: FastAPI + SQLAlchemy + PostgreSQL  
**Authentication**: JWT Tokens
**Storage**: MinIO (S3-compatible)
**Blockchain**: SHA256 hash chaining

All code is fully integrated and ready for testing! 🚀
