<!-- FRS | Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad -->

# Endpoint Catalog

> Complete REST API endpoint reference for the Trade Finance Blockchain Explorer platform.

---

## Base URL

```
http://localhost:8000/api
```

All endpoints require `Authorization: Bearer <token>` header unless marked as public.

---

## Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | Public | Authenticate user and receive JWT |
| POST | `/auth/register` | Public | Create new user account |
| GET | `/auth/me` | Required | Get current user profile |

### POST `/auth/login`
```json
// Request
{ "email": "user@example.com", "password": "secret" }

// Response 200
{ "access_token": "eyJ...", "token_type": "bearer", "user": { "id": 1, "name": "...", "role": "corporate" } }
```

---

## Certificate Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/documents` | Required | List accessible certificates |
| POST | `/documents/upload` | Required | Ingest new certificate |
| GET | `/documents/{id}` | Required | Certificate details |
| POST | `/documents/{id}/verify` | Required | Verify certificate hash |
| DELETE | `/documents/{id}` | Admin | Remove certificate |

---

## Transaction Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/trades` | Required | List transactions |
| POST | `/trades` | Corporate/Admin | Create transaction |
| GET | `/trades/{id}` | Required | Transaction details |
| PUT | `/trades/{id}/status` | Required | Update transaction status |

---

## Audit Chain Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/ledger/{trade_id}` | Admin/Auditor | Query chain entries |
| GET | `/ledger/verify/{trade_id}` | Admin/Auditor | Verify chain integrity |

---

## Threat Assessment Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/risk/{user_id}` | Required | User threat assessment index |
| POST | `/risk/recalculate` | Admin | Trigger bulk recalculation |
| GET | `/risk/distribution` | Admin | Category distribution |

---

## Administration Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/users` | Admin | List all user accounts |
| POST | `/admin/users` | Admin | Create user account |
| PUT | `/admin/users/{id}` | Admin | Update user account |
| DELETE | `/admin/users/{id}` | Admin | Remove user account |
| GET | `/admin/organizations` | Admin | List entities |
| POST | `/admin/organizations` | Admin | Create entity |
| GET | `/admin/audit-logs` | Admin | Query activity logs |
| GET | `/admin/stats` | Admin | System statistics |

---

## Auditor Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/auditor/dashboard` | Auditor | Compliance dashboard data |
| GET | `/auditor/alerts` | Auditor | Compliance alerts |
| POST | `/auditor/alerts/{id}/acknowledge` | Auditor | Acknowledge alert |
| GET | `/auditor/reports` | Auditor | Compliance reports |
| POST | `/auditor/verification/{doc_id}` | Auditor | Verify certificate |

---

## System Monitoring

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/monitoring/health` | Admin | System health check |
| GET | `/monitoring/stats` | Admin | Performance metrics |

---

## Error Responses

All errors follow this format:
```json
{ "detail": "Error description message" }
```

| HTTP Code | Meaning |
|-----------|---------|
| 400 | Bad Request — Invalid parameters |
| 401 | Unauthorized — Invalid or missing JWT |
| 403 | Forbidden — Insufficient access level |
| 404 | Not Found — Resource does not exist |
| 422 | Unprocessable Entity — Validation error |
| 500 | Internal Server Error |

---

**Developer**: Abdul Samad
