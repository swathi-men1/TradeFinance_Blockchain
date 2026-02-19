# API Reference Documentation

## Base URL
```
Development: http://localhost:8000/api/v1
Production: https://your-domain.com/api/v1
```

## Authentication

### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Endpoints

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "bank",
    "org_name": "Acme Corp"
  }
}
```

#### GET /auth/me
Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "role": "bank",
  "org_name": "Acme Corp",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### POST /auth/logout
Invalidate current JWT token.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Successfully logged out"
}
```

---

## Documents

### GET /documents
List documents with role-based filtering.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `skip` (int, optional): Pagination offset (default: 0)
- `limit` (int, optional): Pagination limit (default: 100)
- `doc_type` (string, optional): Filter by document type
- `owner_id` (int, optional): Filter by owner (admin only)

**Response:**
```json
{
  "documents": [
    {
      "id": 1,
      "doc_number": "DOC-2024-001",
      "doc_type": "BILL_OF_LADING",
      "hash": "a1b2c3d4e5f6...",
      "file_url": "documents/bill_of_lading.pdf",
      "owner_id": 1,
      "issued_at": "2024-01-01T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 100
}
```

### POST /documents/upload
Upload new document with integrity verification.

**Headers:** 
```http
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
```
file: <binary_file>
document_data: {
  "doc_type": "BILL_OF_LADING",
  "doc_number": "DOC-2024-002"
}
```

**Response:**
```json
{
  "id": 2,
  "doc_number": "DOC-2024-002",
  "doc_type": "BILL_OF_LADING",
  "hash": "e5f6a7b8c9d1...",
  "file_url": "documents/DOC-2024-002.pdf",
  "owner_id": 1,
  "issued_at": "2024-01-01T00:00:00Z",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### GET /documents/{id}
Get specific document details.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "doc_number": "DOC-2024-001",
  "doc_type": "BILL_OF_LADING",
  "hash": "a1b2c3d4e5f6...",
  "file_url": "documents/bill_of_lading.pdf",
  "owner_id": 1,
  "issued_at": "2024-01-01T00:00:00Z",
  "created_at": "2024-01-01T00:00:00Z",
  "ledger_entries": [
    {
      "id": 1,
      "action": "DOCUMENT_UPLOADED",
      "actor_id": 1,
      "actor_name": "John Doe",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### PUT /documents/{id}
Update document details (owner or admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "doc_type": "COMMERCIAL_INVOICE",
  "doc_number": "DOC-2024-001-UPDATED"
}
```

**Response:**
```json
{
  "id": 1,
  "doc_number": "DOC-2024-001-UPDATED",
  "doc_type": "COMMERCIAL_INVOICE",
  "hash": "a1b2c3d4e5f6...",
  "file_url": "documents/updated_doc.pdf",
  "updated_at": "2024-01-01T01:00:00Z"
}
```

### DELETE /documents/{id}
Delete document (admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Document deleted successfully"
}
```

---

## Trades

### GET /trades
List trade transactions with role-based access.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `skip` (int, optional): Pagination offset
- `limit` (int, optional): Pagination limit
- `status` (string, optional): Filter by status
- `buyer_id` (int, optional): Filter by buyer
- `seller_id` (int, optional): Filter by seller

**Response:**
```json
{
  "trades": [
    {
      "id": 1,
      "buyer_id": 1,
      "seller_id": 2,
      "amount": "10000.00",
      "currency": "USD",
      "status": "pending",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 100
}
```

### POST /trades
Create new trade transaction.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "buyer_id": 1,
  "seller_id": 2,
  "amount": "15000.00",
  "currency": "USD",
  "description": "Trade of electronic components"
}
```

**Response:**
```json
{
  "id": 2,
  "buyer_id": 1,
  "seller_id": 2,
  "amount": "15000.00",
  "currency": "USD",
  "status": "pending",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### GET /trades/{id}
Get specific trade details.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "buyer_id": 1,
  "seller_id": 2,
  "amount": "10000.00",
  "currency": "USD",
  "status": "pending",
  "description": "Trade of electronic components",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "documents": [
    {
      "id": 1,
      "doc_number": "DOC-2024-001",
      "doc_type": "BILL_OF_LADING"
    }
  ],
  "ledger_entries": [
    {
      "id": 5,
      "action": "TRADE_CREATED",
      "actor_id": 1,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### PUT /trades/{id}/status
Update trade status.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "in_progress"
}
```

**Response:**
```json
{
  "id": 1,
  "status": "in_progress",
  "updated_at": "2024-01-01T01:30:00Z"
}
```

---

## Auditor

### GET /auditor/documents
List all documents for auditor review.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `skip` (int, optional): Pagination offset
- `limit` (int, optional): Pagination limit

**Response:**
```json
{
  "documents": [
    {
      "id": 1,
      "doc_number": "DOC-2024-001",
      "doc_type": "BILL_OF_LADING",
      "hash": "a1b2c3d4e5f6...",
      "verification_status": "pending",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /auditor/documents/{id}/verify
Verify document integrity.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "document_id": 1,
  "stored_hash": "a1b2c3d4e5f6...",
  "current_hash": "a1b2c3d4e5f6...",
  "is_valid": true,
  "message": "Document is authentic",
  "verification_timestamp": "2024-01-01T01:00:00Z",
  "flagged_for_investigation": false
}
```

### POST /auditor/documents/{id}/flag
Flag document for investigation.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "reason": "Suspicious activity detected"
}
```

**Response:**
```json
{
  "document_id": 1,
  "is_flagged": true,
  "reason": "Suspicious activity detected",
  "flagged_at": "2024-01-01T01:00:00Z"
}
```

### GET /auditor/ledger/{document_id}/timeline
Get document lifecycle timeline.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "document_id": 1,
  "document_number": "DOC-2024-001",
  "document_type": "BILL_OF_LADING",
  "lifecycle_events": [
    {
      "action": "DOCUMENT_UPLOADED",
      "actor_id": 1,
      "actor_name": "John Doe",
      "timestamp": "2024-01-01T00:00:00Z",
      "is_valid": true,
      "validation_notes": null
    },
    {
      "action": "DOCUMENT_VERIFIED",
      "actor_id": 3,
      "actor_name": "Jane Auditor",
      "timestamp": "2024-01-01T02:00:00Z",
      "is_valid": true,
      "validation_notes": null
    }
  ],
  "is_sequence_valid": true,
  "missing_stages": [],
  "duplicate_actions": [],
  "validation_errors": []
}
```

### GET /auditor/alerts
Get compliance alerts.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status` (string, optional): Filter by status (OPEN, RESOLVED, DISMISSED)
- `severity` (string, optional): Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)
- `skip` (int, optional): Pagination offset
- `limit` (int, optional): Pagination limit

**Response:**
```json
{
  "alerts": [
    {
      "id": 1,
      "alert_type": "DOCUMENT_HASH_MISMATCH",
      "severity": "CRITICAL",
      "status": "OPEN",
      "title": "Document Hash Mismatch Detected",
      "description": "Document DOC-2024-001 hash mismatch detected",
      "document_id": 1,
      "detected_at": "2024-01-01T01:00:00Z"
    }
  ],
  "total_open": 5,
  "total_resolved": 12,
  "by_severity": {
    "LOW": 2,
    "MEDIUM": 3,
    "HIGH": 1,
    "CRITICAL": 1
  }
}
```

### GET /auditor/reports
Generate audit reports.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `start_date` (string, optional): Filter start date
- `end_date` (string, optional): Filter end date
- `document_id` (int, optional): Filter by document
- `trade_id` (int, optional): Filter by trade
- `user_id` (int, optional): Filter by user

**Response:**
```json
{
  "report_type": "AUDIT",
  "generated_at": "2024-01-01T01:00:00Z",
  "generated_by": "Jane Auditor",
  "summary": {
    "total_documents": 100,
    "verified_documents": 85,
    "flagged_documents": 2,
    "total_trades": 50,
    "disputed_trades": 3,
    "total_alerts": 15,
    "open_alerts": 5,
    "high_risk_users": 8
  },
  "document_verifications": [...],
  "ledger_summary": {
    "total_entries": 200,
    "action_breakdown": {
      "DOCUMENT_UPLOADED": 50,
      "DOCUMENT_VERIFIED": 85,
      "TRADE_CREATED": 30,
      "TRADE_UPDATED": 20,
      "USER_REGISTERED": 15
    }
  },
  "integrity_alerts": [...],
  "risk_overview": {
    "total_scored_users": 30,
    "average_score": 45.5,
    "distribution": {
      "LOW": 15,
      "MEDIUM": 10,
      "HIGH": 5
    }
  },
  "transaction_summary": [...]
}
```

---

## Admin

### GET /admin/users/list
List all users with filtering.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `skip` (int, optional): Pagination offset
- `limit` (int, optional): Pagination limit
- `org_name` (string, optional): Filter by organization
- `role` (string, optional): Filter by role
- `is_active` (boolean, optional): Filter by active status

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "bank",
      "org_name": "Acme Corp",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 100
}
```

### POST /admin/users/create
Create new user (admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "password": "password123",
  "role": "corporate",
  "org_name": "Acme Corp",
  "is_active": true
}
```

**Response:**
```json
{
  "id": 2,
  "email": "newuser@example.com",
  "name": "New User",
  "role": "corporate",
  "org_name": "Acme Corp",
  "is_active": true,
  "user_code": "NEW123",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### GET /admin/ledger/all
Get all ledger entries (admin/auditor only).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `skip` (int, optional): Pagination offset
- `limit` (int, optional): Pagination limit

**Response:**
```json
{
  "entries": [
    {
      "id": 1,
      "document_id": 1,
      "action": "DOCUMENT_UPLOADED",
      "actor_id": 1,
      "actor_name": "John Doe",
      "created_at": "2024-01-01T00:00:00Z",
      "entry_metadata": {}
    }
  ]
}
```

---

## Risk

### GET /risk/my-score
Get current user's risk score.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user_id": 1,
  "score": 25.5,
  "category": "LOW",
  "rationale": "User has good document integrity record and low dispute rate. Risk factors: Document Integrity (40%): 8/10, User Activity (25%): 7/10, Transaction Behavior (25%): 6/10, External Risk (10%): 4/10",
  "last_updated": "2024-01-01T00:00:00Z"
}
```

### GET /risk/user/{user_id}
Get specific user's risk score (admin/auditor only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user_id": 2,
  "user_name": "Jane Smith",
  "user_role": "corporate",
  "organization": "Acme Corp",
  "score": 65.0,
  "category": "MEDIUM",
  "rationale": "User has moderate risk factors. Recent disputes and delayed payments detected.",
  "last_updated": "2024-01-01T00:00:00Z"
}
```

### POST /risk/recalculate-all
Trigger bulk risk score recalculation (admin only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Risk score recalculation initiated for all users",
  "affected_users": 25,
  "initiated_at": "2024-01-01T01:00:00Z"
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "Specific error details"
    }
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "status": 400
}
```

### Common Error Codes

#### Authentication Errors
- `UNAUTHORIZED` (401): Invalid or missing token
- `TOKEN_EXPIRED` (401): JWT token has expired
- `FORBIDDEN` (403): Insufficient permissions

#### Validation Errors
- `VALIDATION_ERROR` (422): Request validation failed
- `INVALID_INPUT` (400): Malformed request data

#### Resource Errors
- `NOT_FOUND` (404): Resource does not exist
- `CONFLICT` (409): Resource already exists
- `RATE_LIMIT_EXCEEDED` (429): Too many requests

#### Server Errors
- `INTERNAL_ERROR` (500): Unexpected server error
- `SERVICE_UNAVAILABLE` (503): Service temporarily unavailable

### HTTP Status Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `422 Unprocessable Entity`: Validation failed
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Rate Limiting

### Default Limits
- **Authentication**: 10 requests per minute
- **Document Upload**: 5 requests per minute
- **Trade Creation**: 10 requests per minute
- **Report Generation**: 3 requests per minute
- **General API**: 100 requests per minute

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Data Models

### User Model
```json
{
  "id": "integer",
  "email": "string (unique)",
  "name": "string",
  "role": "enum (bank, corporate, auditor, admin)",
  "org_name": "string",
  "is_active": "boolean",
  "user_code": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Document Model
```json
{
  "id": "integer",
  "doc_number": "string (unique)",
  "doc_type": "enum (BILL_OF_LADING, COMMERCIAL_INVOICE, etc.)",
  "hash": "string (SHA-256)",
  "file_url": "string",
  "owner_id": "integer (foreign key)",
  "issued_at": "datetime",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Trade Model
```json
{
  "id": "integer",
  "buyer_id": "integer (foreign key)",
  "seller_id": "integer (foreign key)",
  "amount": "decimal (15,2)",
  "currency": "string (3)",
  "status": "enum (pending, in_progress, completed, disputed)",
  "description": "text",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Ledger Entry Model
```json
{
  "id": "integer",
  "document_id": "integer (foreign key, nullable)",
  "action": "enum (various actions)",
  "actor_id": "integer (foreign key)",
  "entry_hash": "string (SHA-256)",
  "previous_hash": "string (SHA-256, nullable)",
  "entry_metadata": "jsonb",
  "created_at": "datetime"
}
```

This API reference provides comprehensive documentation for all available endpoints in the Trade Finance Blockchain Explorer system.
