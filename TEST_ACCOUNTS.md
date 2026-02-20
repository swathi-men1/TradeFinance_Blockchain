# 🔐 Test Accounts - Trade Finance Blockchain

> **Last Updated:** February 20, 2026 15:04:54 UTC  
> **Status:** 7 fresh accounts with clean database

---

## 🎯 Quick Login Credentials

Use these credentials to test the application at **http://localhost:5173**

### Admin
```
Email:    admin@tradefinance.com
Password: admin123!@#
User ID:  #1 (ADM-001)
Org:      Trade Finance Platform
```

### Bank Users
```
Email:    bank@globalbank.com
Password: bank123!@#
User ID:  #2 (BANK-001)
Org:      Global Bank Ltd
```
```
Email:    bank@europeanbank.com
Password: bank123!@#
User ID:  #3 (BANK-002)
Org:      European Bank AG
```

### Corporate Users
```
Email:    corporate@company.com
Password: corporate123!@#
User ID:  #4 (CORP-001)
Org:      Acme Corporation
```
```
Email:    corporate@techcorp.com
Password: corporate123!@#
User ID:  #5 (CORP-002)
Org:      Tech Trading Inc
```
```
Email:    corporate@asiacorp.com
Password: corporate123!@#
User ID:  #6 (CORP-003)
Org:      Asia Trade Partners
```

### Auditor
```
Email:    auditor@auditfirm.com
Password: auditor123!@#
User ID:  #7 (AUD-001)
Org:      Independent Audit Services
```

---

## 📋 Full Account Details

| ID | User Code | Name | Email | Password | Role | Organization |
|---|---|---|---|---|---|---|
| #1 | ADM-001 | System Administrator | admin@tradefinance.com | `admin123!@#` | **admin** | Trade Finance Platform |
| #2 | BANK-001 | Sarah Banking | bank@globalbank.com | `bank123!@#` | **bank** | Global Bank Ltd |
| #3 | BANK-002 | David European Bank | bank@europeanbank.com | `bank123!@#` | **bank** | European Bank AG |
| #4 | CORP-001 | John Corporate | corporate@company.com | `corporate123!@#` | **corporate** | Acme Corporation |
| #5 | CORP-002 | Emily Tech Trading | corporate@techcorp.com | `corporate123!@#` | **corporate** | Tech Trading Inc |
| #6 | CORP-003 | Lisa Asia Trade | corporate@asiacorp.com | `corporate123!@#` | **corporate** | Asia Trade Partners |
| #7 | AUD-001 | Michael Auditor | auditor@auditfirm.com | `auditor123!@#` | **auditor** | Independent Audit Services |

---

## 🧪 Testing Workflows

### Test Admin (ID #1)
1. Login with **admin@tradefinance.com / admin123!@#**
2. Access: Dashboard, Documents, Risk Oversight, User Management, Audit Logs
3. Can: View all documents, manage users, configure system, view all risks

### Test Bank User 1 (ID #2): Global Bank
1. Login with **bank@globalbank.com / bank123!@#**
2. Access: Dashboard, Documents, Trades, Risk Score
3. Can: Create trades, upload documents (including LOC), manage documents, view risk score

### Test Bank User 2 (ID #3): European Bank
1. Login with **bank@europeanbank.com / bank123!@#**
2. Access: Dashboard, Documents, Trades, Risk Score
3. Can: Create trades, upload documents (including LOC), manage documents, view risk score
4. **Use for multi-bank scenarios**

### Test Corporate User 1 (ID #4): Acme Corporation
1. Login with **corporate@company.com / corporate123!@#**
2. Access: Dashboard, Documents, Trades, Risk Score
3. Can: Participate in trades, upload documents (except LOC), view their risk score

### Test Corporate User 2 (ID #5): Tech Trading
1. Login with **corporate@techcorp.com / corporate123!@#**
2. Access: Dashboard, Documents, Trades, Risk Score
3. Can: Participate in trades, upload documents (except LOC), view their risk score
4. **Use for multi-party trade scenarios**

### Test Corporate User 3 (ID #6): Asia Trade
1. Login with **corporate@asiacorp.com / corporate123!@#**
2. Access: Dashboard, Documents, Trades, Risk Score
3. Can: Participate in trades, upload documents (except LOC), view their risk score
4. **Use for three-party trade scenarios**

### Test Auditor (ID #7)
1. Login with **auditor@auditfirm.com / auditor123!@#**
2. Access: Dashboard, Documents (read-only), Ledger, Risk Monitor, Alerts, Reports
3. Can: View all documents, verify hashes, review ledger, flag documents, view all risks

---

## ✅ Account Features by Role

| Feature | Admin | Bank | Corporate | Auditor |
|---------|-------|------|-----------|---------|
| Create Trade | ✅ | ✅ | ❌ | ❌ |
| Participate in Trade | ✅ | ✅ | ✅ | ❌ |
| Upload Document | ✅ | ✅ | ✅ | ❌ |
| Upload LOC | ✅ | ✅ | ❌ | ❌ |
| View Own Docs | ✅ | ✅ | ✅ | - |
| View All Docs | ✅ | ❌ | ❌ | ✅ |
| View Own Risk | ✅ | ✅ | ✅ | - |
| View All Risk | ✅ | ❌ | ❌ | ✅ |
| View Ledger | ✅ | Limited | Limited | ✅ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Flag Document | ❌ | ❌ | ❌ | ✅ |
| Verify Hashes | ✅ | ✅ | ✅ | ✅ |
| View Audit Logs | ✅ | ❌ | ❌ | ❌ |

---

## 🔗 API Testing

### Health Check
```bash
curl http://localhost:8000/health
```

### Login Example
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tradefinance.com",
    "password": "admin123!@#"
  }'
```

### View Current User
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/api/v1/auth/me
```

### List Documents
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/api/v1/documents
```

### List Trades
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/api/v1/trades
```

---

## 📚 Related Documentation

- **Backend Setup:** See [QUICKSTART_GUIDE.md](./QUICKSTART_GUIDE.md)
- **API Documentation:** http://localhost:8000/docs (Swagger UI)
- **Architecture:** See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- **API Reference:** See [docs/API_REFERENCE.md](./docs/API_REFERENCE.md)

---

## 🔄 Reset Accounts

To create fresh accounts, run:
```bash
cd backend
python seed_database.py --force
```

This will:
- Update all existing user passwords to their defaults
- Reactivate all disabled accounts
- Keep all existing data intact

---

## ⚠️ Important Notes

1. **Passwords are NOT encrypted in this file** - Keep this file secure!
2. **This is for development/testing only** - Do not use in production
3. **All accounts are initially ACTIVE** - No approval needed
4. **Passwords follow pattern:** `[role]123!@#` (e.g., `admin123!@#`, `bank123!@#`)
5. **To create new users:** Use Admin dashboard at http://localhost:5173/admin/users

---

## 🆘 Troubleshooting

### "Invalid credentials" error
- Copy password exactly (including special characters)
- Check that backend is running on port 8000
- Verify user is active in admin panel

### "User not found"
- Run `python seed_database.py --force` to recreate accounts
- Check database is connected: `psql -U postgres -d trade_finance -c "SELECT email FROM users;"`

### Forgot user ID
- Check User Management in Admin panel
- Or query database: `psql -U postgres -d trade_finance -c "SELECT id, user_code, email FROM users;"`

---

Generated automatically from seed_database.py
