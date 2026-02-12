# Trade Finance Blockchain Explorer

> A modern, blockchain-inspired trade finance platform with immutable ledger tracking, document management, and role-based access control.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688.svg?style=flat&logo=FastAPI)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=flat&logo=React)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg?style=flat&logo=TypeScript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791.svg?style=flat&logo=PostgreSQL)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat&logo=Docker)](https://www.docker.com)

---

## 🎯 Overview

Trade Finance Blockchain Explorer is a comprehensive platform for managing trade finance operations with cryptographic integrity, immutable audit trails, and intelligent risk assessment. Built for banks, corporations, auditors, and administrators to streamline international trade workflows.

### Key Capabilities

- **Document Management** - Secure upload, storage, and verification of trade documents (Letter of Credit, Invoices, Bills of Lading)
- **Trade Lifecycle Tracking** - End-to-end monitoring from initiation to completion
- **Immutable Ledger** - Blockchain-inspired append-only audit trail for all transactions
- **Risk Scoring** - Real-time counterparty risk assessment and monitoring
- **Hash Verification** - SHA-256 cryptographic integrity checking
- **Role-Based Access** - Granular permissions for Bank, Corporate, Auditor, and Admin roles

---

## 🚀 Features

### Core Functionality
- ✅ **JWT Authentication** - Secure token-based authentication with role management
- ✅ **User Code System** - Professional 6-character user identification (e.g., `JOH847`)
- ✅ **Document Upload** - S3-compatible storage with automatic hash generation
- ✅ **Trade Management** - Complete CRUD operations for trade transactions
- ✅ **Risk Scoring** - Automated risk category assessment (LOW/MEDIUM/HIGH)
- ✅ **Ledger Tracking** - Immutable record of all document and trade actions
- ✅ **Hash Verification** - Real-time integrity validation

### User Experience
- 🎨 **Modern UI** - Sleek glassmorphism design with neon gradients
- 📱 **Responsive** - Mobile-friendly interface with adaptive layouts
- 🌍 **Timezone Aware** - Automatic local timezone detection and display
- 🔔 **Real-time Notifications** - Instant feedback for all operations
- 📊 **Interactive Dashboards** - Role-specific analytics and insights

### Security & Compliance
- 🔐 **Password Hashing** - Bcrypt encryption for user credentials
- 🔑 **JWT Tokens** - Secure session management
- 🛡️ **RBAC** - Role-based access control enforced at API and UI levels
- 📝 **Audit Logging** - Complete action history for compliance
- 🔗 **Hash Chains** - Linked ledger entries for tamper detection

---

## 🛠️ Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| FastAPI | 0.109.0 | High-performance async API framework |
| PostgreSQL | 14+ | Relational database |
| SQLAlchemy | 2.0.25 | ORM and query builder |
| Alembic | Latest | Database migrations |
| MinIO | Latest | S3-compatible object storage |
| Python | 3.11 | Runtime environment |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18 | UI framework |
| TypeScript | 5 | Type-safe development |
| Vite | 5 | Build tool and dev server |
| CSS3 | - | Styling (Glassmorphism) |
| Axios | Latest | HTTP client |
| React Router | 6 | Client-side routing |

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Frontend web server
- **MinIO** - S3-compatible storage

---

## 📁 Project Structure

```
TradeFinance_Blockchain/
├── backend/                      # FastAPI Backend
│   ├── app/
│   │   ├── api/                 # REST API endpoints
│   │   │   ├── auth.py         # Authentication routes
│   │   │   ├── documents.py    # Document management
│   │   │   ├── trades.py       # Trade operations
│   │   │   ├── risk.py         # Risk scoring
│   │   │   ├── ledger.py       # Ledger operations
│   │   │   └── admin.py        # Admin operations
│   │   ├── core/               # Core utilities
│   │   │   ├── security.py    # JWT & password hashing
│   │   │   └── hashing.py     # SHA-256 file hashing
│   │   ├── db/                 # Database configuration
│   │   ├── models/             # SQLAlchemy models
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── services/           # Business logic layer
│   │   └── utils/              # Helper functions
│   ├── alembic/                # Database migrations
│   ├── requirements.txt
│   ├── Dockerfile
│   └── wait-for-db.sh         # Startup script
├── frontend/                    # React Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # React context providers
│   │   ├── pages/              # Page components
│   │   ├── services/           # API integration
│   │   ├── types/              # TypeScript definitions
│   │   ├── utils/              # Utility functions
│   │   ├── App.tsx             # Main application
│   │   └── index.css           # Global styles
│   ├── public/                 # Static assets
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml           # Container orchestration
├── README.md                    # This file
└── QUICKSTART_GUIDE.md         # Quick start instructions

```

---

## 🚦 Quick Start

### Prerequisites
- Docker Desktop (v20.10+)
- Docker Compose (v2.0+)
- 4GB RAM minimum
- Ports available: 80, 8000, 5432, 9000, 9001

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TradeFinance_Blockchain
   ```

2. **Start all services**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - **Frontend**: http://localhost
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs
   - **MinIO Console**: http://localhost:9001

4. **Default credentials** (for testing)
   - Register a new user via the UI
   - Or use API: `POST /api/v1/auth/register`

### Stopping the Application
```bash
docker-compose down
```

For detailed setup instructions, see [QUICKSTART_GUIDE.md](QUICKSTART_GUIDE.md)

---

## 👥 User Roles

| Role | Permissions | Use Case |
|------|-------------|----------|
| **Bank** | Upload documents, create trades, view own data, risk scoring | Financial institutions managing trade finance |
| **Corporate** | Upload documents, create trades, view own data, risk scoring | Businesses engaged in international trade |
| **Auditor** | Read-only access to all documents and trades, monitoring | Compliance and audit teams |
| **Admin** | Full system access, user management, logging | System administrators |

### Role-Specific Features

**Bank & Corporate:**
- Create and manage trades
- Upload trade documents
- View risk scores
- Access personal dashboards
- Upload supporting documents

**Auditor:**
- View all documents (read-only)
- Access monitoring dashboard
- Review audit logs
- Generate compliance reports

**Admin:**
- User management (CRUD)
- Trade management (CRUD)
- System monitoring
- Access all features

---

## 📊 Database Schema

### Core Tables

**users** - User accounts and authentication
- `id`, `user_code`, `name`, `email`, `password`, `role`, `organization_name`
- Unique 6-character user codes (e.g., `JOH847`)

**documents** - Document metadata
- `id`, `filename`, `file_hash` (SHA-256), `s3_key`, `uploaded_by`, `created_at`

**trade_transactions** - Trade lifecycle
- `id`, `buyer_id`, `seller_id`, `amount`, `currency`, `status`, `created_at`
- Statuses: PENDING, APPROVED, COMPLETED, REJECTED

**trade_documents** - Trade-document relationships
- Links trades to supporting documents

**ledger_entries** - Immutable audit trail
- `id`, `action`, `actor_id`, `document_id`, `previous_entry_hash`, `entry_hash`
- Hash chain for tamper detection

**risk_scores** - Counterparty risk assessment
- `id`, `user_id`, `score` (0-100), `category` (LOW/MEDIUM/HIGH), `calculated_at`

**audit_logs** - System monitoring
- `id`, `user_id`, `action`, `details`, `timestamp`

---

## 🔐 Security Features

### Authentication & Authorization
- **JWT Tokens** - Secure, stateless authentication
- **Password Hashing** - Bcrypt with salt
- **Role-Based Access Control** - Enforced at API and UI levels
- **Session Management** - Token expiration and refresh

### Data Integrity
- **SHA-256 Hashing** - File integrity verification
- **Hash Chains** - Ledger entry linking for tamper detection
- **Immutable Ledger** - Append-only audit trail
- **Database Constraints** - Referential integrity

### Application Security
- **CORS Protection** - Configured allowed origins
- **Input Validation** - Pydantic schemas
- **SQL Injection Prevention** - SQLAlchemy ORM
- **XSS Protection** - React escape by default

---

## 📖 API Reference

### Authentication
```http
POST   /api/v1/auth/register    # Register new user
POST   /api/v1/auth/login       # Login and receive JWT
GET    /api/v1/auth/me          # Get current user info
```

### Documents
```http
POST   /api/v1/documents/upload      # Upload document (multipart/form-data)
GET    /api/v1/documents              # List documents (role-scoped)
GET    /api/v1/documents/{id}         # Get document details
GET    /api/v1/documents/{id}/verify  # Verify hash integrity
DELETE /api/v1/documents/{id}         # Delete document (admin only)
```

### Trades
```http
POST   /api/v1/trades              # Create new trade
GET    /api/v1/trades              # List trades (role-scoped)
GET    /api/v1/trades/{id}         # Get trade details
PUT    /api/v1/trades/{id}/status  # Update trade status
DELETE /api/v1/trades/{id}         # Delete trade (admin only)
```

### Risk Scoring
```http
GET    /api/v1/risk/my-score       # Get current user's risk score
POST   /api/v1/risk/calculate      # Calculate risk for user
GET    /api/v1/risk/history/{id}   # Get risk score history
```

### Ledger
```http
POST   /api/v1/ledger/entries           # Create ledger entry
GET    /api/v1/ledger/documents/{id}    # Get document ledger timeline
GET    /api/v1/ledger/verify-chain      # Verify ledger integrity
```

### Admin
```http
GET    /api/v1/admin/users           # List all users
POST   /api/v1/admin/users           # Create user
DELETE /api/v1/admin/users/{id}      # Delete user
GET    /api/v1/admin/audit-logs      # View audit logs
```

**Interactive API Documentation**: http://localhost:8000/docs

---

## 🎨 User Interface

### Design System
- **Color Palette**: Dark theme with neon purple, cyan, and lime accents
- **Typography**: Inter (UI), Fira Code (monospace)
- **Effects**: Glassmorphism, gradient backgrounds, subtle animations
- **Layout**: Responsive grid system, mobile-first approach

### Key Components
- **Dashboard** - Role-specific analytics and quick actions
- **Document Explorer** - File management with drag-drop upload
- **Trade Manager** - Complete trade workflow interface
- **Risk Score Widget** - Visual risk indicators
- **Ledger Timeline** - Interactive audit trail visualization
- **User Code Badges** - Styled user identification

---

## 🧪 Testing

### Manual Testing
1. Register users with different roles
2. Upload various document types
3. Create trades and link documents
4. Verify hash integrity
5. Check ledger entries
6. Test role-based access restrictions

### API Testing
Use the interactive Swagger UI at http://localhost:8000/docs

---

## 🐛 Troubleshooting

### Common Issues

**Containers won't start:**
```bash
docker-compose down -v
docker-compose up --build
```

**Database migration errors:**
```bash
docker-compose exec backend alembic upgrade head
```

**MinIO connection issues:**
- Check MinIO console: http://localhost:9001
- Default credentials: minioadmin / minioadmin

**Frontend not loading:**
- Clear browser cache
- Check console for errors
- Verify backend is running on port 8000

**CORS errors:**
- Ensure frontend is accessed via http://localhost (not 127.0.0.1)
- Check backend CORS settings

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## 🔄 Database Migrations

### View migration status
```bash
docker-compose exec backend alembic current
```

### Create new migration
```bash
docker-compose exec backend alembic revision -m "description"
```

### Apply migrations
```bash
docker-compose exec backend alembic upgrade head
```

### Rollback migration
```bash
docker-compose exec backend alembic downgrade -1
```

---

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**
   - Set strong `SECRET_KEY` for JWT
   - Configure `DATABASE_URL` for production database
   - Update `CORS_ORIGINS` to actual frontend domain
   - Set `MINIO_ENDPOINT` to production storage

2. **Database**
   - Use managed PostgreSQL service
   - Enable SSL connections
   - Configure backups

3. **Object Storage**
   - Use AWS S3 or production MinIO cluster
   - Enable encryption at rest
   - Configure bucket policies

4. **Security**
   - Enable HTTPS (TLS/SSL certificates)
   - Implement rate limiting
   - Set up monitoring and alerts
   - Regular security audits

---

## 📝 License

MIT License - see LICENSE file for details

---

## 🤝 Contributing

This project follows industry best practices for trade finance blockchain applications.

For questions or support, please open an issue in the repository.

---

## 📞 Support

For technical support or questions:
- Review the [QUICKSTART_GUIDE.md](QUICKSTART_GUIDE.md)
- Check API documentation at http://localhost:8000/docs
- Review troubleshooting section above

---

**Built with ❤️ for modern trade finance operations**
