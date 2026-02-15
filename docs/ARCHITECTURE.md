# System Architecture Documentation

## Overview

The Trade Finance Blockchain Explorer follows a microservices architecture with clear separation of concerns between frontend, backend, and data layers. The system is designed for scalability, security, and maintainability.

## High-Level Architecture

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                Load Balancer (Nginx)                │
                    └─────────────────────┬───────────────────────────────┘
                                          │
                ┌─────────────────────┴─────────────────────┐
                │            Frontend Container            │
                │         (React + Nginx)               │
                │  Port: 3000                               │
                └─────────────────────┬─────────────────────┘
                                      │ HTTP/HTTPS API
                ┌─────────────────────┴─────────────────────┐
                │            Backend Container               │
                │         (FastAPI + Python)             │
                │  Port: 8000                               │
                └─────────────────────┬─────────────────────┘
                                      │
                ┌─────────────────────┴─────────────────────┐
                │            Database Cluster                │
                │         (PostgreSQL)                    │
                │  Port: 5432                               │
                └─────────────────────────────────────────────┘
```

## Technology Stack

### Frontend Layer
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5.0
- **Styling**: TailwindCSS 3.4
- **State Management**: React Context + Hooks
- **HTTP Client**: Axios 1.6+
- **Routing**: React Router DOM 6.21+
- **UI Components**: Custom glass-morphism design system
- **Icons**: Lucide React 0.263+
- **Deployment**: Nginx 1.25 (Alpine Linux)

### Backend Layer
- **Framework**: FastAPI 0.104+
- **Language**: Python 3.11
- **Database ORM**: SQLAlchemy 2.0+
- **Database**: PostgreSQL 15
- **Authentication**: JWT (JSON Web Tokens)
- **API Documentation**: OpenAPI 3.0 (Swagger/ReDoc)
- **File Storage**: MinIO (S3-compatible)
- **Task Queue**: Built-in FastAPI background tasks
- **Validation**: Pydantic 2.0+
- **Migration Tool**: Alembic

### Infrastructure Layer
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Docker Compose for development
- **Load Balancing**: Nginx reverse proxy
- **File Storage**: MinIO object storage
- **Database**: PostgreSQL with connection pooling
- **Monitoring**: Application logs and health checks
- **Security**: CORS, rate limiting, input validation

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Request Flow                     │
└─────────────────────────────────────────────────────────────────┘
                           │
        ┌────────────────────┴────────────────────┐
        │         Frontend (React SPA)          │
        │  ┌─────────────┬─────────────────┐  │
        │  │   UI Layer   │   Service Layer │  │
        │  │ (Components)  │ (API Calls)    │  │
        │  └─────────────┴─────────────────┘  │
        └────────────────────┬────────────────────┘
                           │ HTTP/HTTPS
        ┌────────────────────┴────────────────────┐
        │          Backend (FastAPI)           │
        │  ┌─────────────┬─────────────────┐  │
        │  │  API Layer   │  Service Layer │  │
        │  │ (Routes)     │ (Business)     │  │
        │  └─────────────┴─────────────────┘  │
        └────────────────────┬────────────────────┘
                           │
        ┌────────────────────┴────────────────────┐
        │         Data Layer (PostgreSQL)        │
        │  ┌─────────────┬─────────────────┐  │
        │  │   Models     │   Migrations    │  │
        │  │ (ORM)       │ (Alembic)       │  │
        │  └─────────────┴─────────────────┘  │
        └─────────────────────────────────────────────┘
```

## Security Architecture

### Authentication & Authorization
```
┌─────────────────────────────────────────────────────────┐
│                JWT Authentication Flow              │
└─────────────────────────────────────────────────────────┘
                           │
        ┌────────────────────┴────────────────────┐
        │         User Login Request              │
        └────────────────────┬────────────────────┘
                           │
        ┌────────────────────┴────────────────────┐
        │      Backend Validation & JWT Gen        │
        │  ┌─────────────┬─────────────────┐  │
        │  │ Credentials  │   Role Info     │  │
        │  │   Check      │   Embedded      │  │
        │  └─────────────┴─────────────────┘  │
        └────────────────────┬────────────────────┘
                           │ JWT Token
        ┌────────────────────┴────────────────────┐
        │        Frontend Token Storage            │
        │  ┌─────────────┬─────────────────┐  │
        │  │   Local      │   API Header    │  │
        │  │  Storage     │   Attachment   │  │
        │  └─────────────┴─────────────────┘  │
        └─────────────────────────────────────────────┘
```

### Role-Based Access Control (RBAC)
```
┌─────────────────────────────────────────────────────────┐
│                Role-Based Access Control              │
└─────────────────────────────────────────────────────────┘
                           │
        ┌────────────────────┬────────────────────┬────────────────────┐
        │      Bank        │     Corporate     │      Auditor        │
        └────────────────────┴────────────────────┴────────────────────┘
                           │                    │                    │
        ┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
        │ Document Upload   │    │  Document Upload   │    │   Document Review  │
        │ Trade Management  │    │  Trade Management  │    │   Ledger Access    │
        │ Own Activity Only │    │  Own Activity Only │    │  Full System Access│
        └────────────────────┘    └────────────────────┘    └────────────────────┘
```

## Database Architecture

### Schema Design
```
┌─────────────────────────────────────────────────────────┐
│                PostgreSQL Database                 │
└─────────────────────────────────────────────────────────┘
                           │
        ┌────────────────────┬────────────────────┬────────────────────┐
        │     Users        │    Documents      │     Ledger         │
        │                 │                   │                   │
        │ • id            │ • id              │ • id              │
        │ • email         │ • doc_number      │ • document_id     │
        │ • role          │ • hash            │ • action          │
        │ • permissions   │ • file_url        │ • actor_id        │
        │                 │ • owner_id        │ • entry_hash      │
        └────────────────────┴────────────────────┴────────────────────┘
                           │                    │                   │
        ┌────────────────────┬────────────────────┬────────────────────┐
        │    Trades         │   Risk Scores     │   Compliance      │
        │                 │                   │                   │
        │ • id            │ • user_id         │ • id              │
        │ • buyer_id      │ • score           │ • alert_type      │
        │ • seller_id     │ • category        │ • severity        │
        │ • amount        │ • rationale       │ • status          │
        │ • status        │ • last_updated    │ • description     │
        └────────────────────┴────────────────────┴────────────────────┘
```

### Indexing Strategy
```sql
-- Primary Keys
CREATE INDEX idx_users_id ON users(id);
CREATE INDEX idx_documents_id ON documents(id);
CREATE INDEX idx_ledger_id ON ledger_entries(id);

-- Foreign Keys
CREATE INDEX idx_documents_owner ON documents(owner_id);
CREATE INDEX idx_ledger_document ON ledger_entries(document_id);
CREATE INDEX idx_ledger_actor ON ledger_entries(actor_id);

-- Search & Filtering
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_documents_number ON documents(doc_number);
CREATE INDEX idx_ledger_created ON ledger_entries(created_at);
CREATE INDEX idx_documents_hash ON documents(hash);
```

## API Architecture

### RESTful Design
```
┌─────────────────────────────────────────────────────────┐
│                RESTful API Design                 │
└─────────────────────────────────────────────────────────┘
                           │
        ┌────────────────────┬────────────────────┬────────────────────┐
        │   Authentication  │    Documents       │     Trades         │
        │                 │                   │                   │
        │ POST /login     │ GET /documents    │ GET /trades       │
        │ POST /register   │ POST /upload      │ POST /trades       │
        │ GET /me         │ GET /{id}         │ GET /{id}         │
        │                 │ PUT /{id}         │ PUT /{id}/status  │
        │                 │ DELETE /{id}      │                   │
        └────────────────────┴────────────────────┴────────────────────┘
                           │                    │                   │
        ┌────────────────────┬────────────────────┬────────────────────┐
        │     Auditor      │      Admin         │     Risk          │
        │                 │                   │                   │
        │ GET /auditor/* │ GET /admin/*      │ GET /risk/*       │
        │ POST /verify     │ POST /users/*     │ POST /recalculate  │
        │ GET /reports     │ GET /orgs/*       │ GET /distribution  │
        └────────────────────┴────────────────────┴────────────────────┘
```

### Request/Response Pattern
```json
// Standard Request Format
{
  "data": { /* request payload */ },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0.0"
  }
}

// Standard Response Format
{
  "data": { /* response data */ },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-01T00:00:00Z",
  "status": 200
}

// Error Response Format
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { /* field-specific errors */ }
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "status": 422
}
```

## Frontend Architecture

### Component Hierarchy
```
┌─────────────────────────────────────────────────────────┐
│                React Application                 │
└─────────────────────────────────────────────────────────┘
                           │
        ┌────────────────────┬────────────────────┬────────────────────┐
        │      App         │    Router         │    Context        │
        │                 │                   │                   │
        │ • Route Def    │ • Path Routing   │ • Auth Context   │
        │ • Layout Mgmt   │ • Protected      │ • User State    │
        └────────────────────┴────────────────────┴────────────────────┘
                           │                    │                   │
        ┌────────────────────┬────────────────────┬────────────────────┐
        │    Components    │     Pages         │    Services       │
        │                 │                   │                   │
        │ • GlassCard     │ • Dashboard      │ • API Client     │
        │ • Sidebar       │ • Documents      │ • Auditor API   │
        │ • Navigation    │ • Trades         │ • Ledger API     │
        │ • Forms         │ • Auth           │ • Risk API       │
        └────────────────────┴────────────────────┴────────────────────┘
```

### State Management
```
┌─────────────────────────────────────────────────────────┐
│                React State Management            │
└─────────────────────────────────────────────────────────┘
                           │
        ┌────────────────────┬────────────────────┬────────────────────┐
        │   Auth Context   │  Local Component   │   Global State    │
        │                 │                   │                   │
        │ • User Data     │ • Form State     │ • Theme          │
        │ • Login Status   │ • UI State       │ • Language       │
        │ • Permissions   │ • Loading State   │ • Preferences    │
        └────────────────────┴────────────────────┴────────────────────┘
```

## Backend Architecture

### Service Layer Pattern
```
┌─────────────────────────────────────────────────────────┐
│                Backend Services                 │
└─────────────────────────────────────────────────────────┘
                           │
        ┌────────────────────┬────────────────────┬────────────────────┐
        │   API Layer     │  Service Layer    │   Data Layer      │
        │                 │                   │                   │
        │ • Route Def     │ • Business Logic  │ • Models         │
        │ • Validation    │ • Data Processing │ • Database       │
        │ • Auth Check   │ • External APIs   │ • Migrations      │
        └────────────────────┴────────────────────┴────────────────────┘
```

### Dependency Injection
```python
# FastAPI Dependency Injection
from fastapi import Depends
from sqlalchemy.orm import Session

def get_db() -> Session:
    """Database dependency"""
    return SessionLocal()

def get_current_user() -> User:
    """Authentication dependency"""
    # JWT validation and user extraction
    pass

# Usage in routes
@router.get("/users")
def get_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Endpoint with injected dependencies"""
```

## File Storage Architecture

### MinIO Integration
```
┌─────────────────────────────────────────────────────────┐
│                MinIO Object Storage              │
└─────────────────────────────────────────────────────────┘
                           │
        ┌────────────────────┬────────────────────┬────────────────────┐
        │   Application    │     Backend        │   Frontend        │
        │                 │                   │                   │
        │ • File Upload   │ • S3 Client      │ • File Display   │
        │ • Download      │ • Hash Storage    │ • Preview        │
        │ • Preview       │ • Integrity Check │ • Gallery        │
        └────────────────────┴────────────────────┴────────────────────┘
                           │                    │                   │
        ┌────────────────────────────────────────────────────┐
        │              MinIO Server                   │
        │  ┌─────────────┬────────────────────┐        │
        │  │   Buckets   │   Objects       │        │
        │  │             │                   │        │
        │  │ • docs     │ • File Content  │        │
        │  │ • temp     │ • Metadata       │        │
        │  │ • backups  │ • Versions       │        │
        │  └─────────────┴────────────────────┘        │
        └────────────────────────────────────────────────────┘
```

### Document Integrity Flow
```
┌─────────────────────────────────────────────────────────┐
│            Document Integrity Verification          │
└─────────────────────────────────────────────────────────┘
                           │
        ┌────────────────────┐
        │   File Upload     │
        │  ┌─────────────┐  │
        │  │   Compute   │  │
        │  │   SHA-256   │  │
        │  └─────────────┘  │
        └────────────────────┬───┘
                           │
        ┌────────────────────┐
        │   Store Hash      │
        │  ┌─────────────┐  │
        │  │   Database  │  │
        │  │   MinIO     │  │
        │  └─────────────┘  │
        └────────────────────┘
                           │
        ┌────────────────────┐
        │   Ledger Entry    │
        │  ┌─────────────┐  │
        │  │   Chain     │  │
        │  │   Hashes    │  │
        │  └─────────────┘  │
        └────────────────────┘
```

## Deployment Architecture

### Docker Container Strategy
```
┌─────────────────────────────────────────────────────────┐
│                Docker Deployment                 │
└─────────────────────────────────────────────────────────┘
                           │
        ┌────────────────────┬────────────────────┬────────────────────┐
        │   Frontend      │     Backend        │   Infrastructure  │
        │                 │                   │                   │
        │ • Nginx        │ • Python         │ • PostgreSQL     │
        │ • Multi-stage    │ • Single-stage    │ • MinIO          │
        │ • Static files   │ • API Server     │ • Data Volume    │
        │ • Port 3000     │ • Port 8000     │ • Port 5432     │
        └────────────────────┴────────────────────┴────────────────────┘
                           │                    │                   │
        ┌────────────────────────────────────────────────────┐
        │              Docker Network                │
        │  ┌────────────────────────────────────┐   │
        │  │     Internal Communication      │   │
        │  │ • Service Discovery           │   │
        │  │ • Load Balancing            │   │
        │  │ • Health Checks             │   │
        │  └────────────────────────────┘   │
        └────────────────────────────────────────────┘
```

### Production Considerations
```
┌─────────────────────────────────────────────────────────┐
│            Production Deployment Considerations      │
└─────────────────────────────────────────────────────────┘
                           │
        ┌────────────────────┬────────────────────┬────────────────────┐
        │   Security       │   Performance     │   Scalability     │
        │                 │                   │                   │
        │ • HTTPS Only    │ • Caching        │ • Load Balancing  │
        │ • Rate Limit   │ • Optimization   │ • Horizontal     │
        │ • Input Valid   │ • Monitoring     │ • Database Pool  │
        │ • Secrets Mgmt  │ • Logging        │ • Auto Scaling   │
        └────────────────────┴────────────────────┴────────────────────┘
```

## Monitoring & Observability

### Application Monitoring
```
┌─────────────────────────────────────────────────────────┐
│              Application Monitoring               │
└─────────────────────────────────────────────────────────┘
                           │
        ┌────────────────────┬────────────────────┬────────────────────┐
        │    Logging       │   Metrics        │   Health Checks   │
        │                 │                   │                   │
        │ • Structured    │ • Response Time  │ • Service Status │
        │ • Centralized   │ • Error Rates    │ • Dependencies   │
        │ • Log Levels    │ • Throughput     │ • Resource Use  │
        │ • Rotation      │ • Active Users    │ • Auto Healing   │
        └────────────────────┴────────────────────┴────────────────────┘
```

### Database Monitoring
```
┌─────────────────────────────────────────────────────────┐
│               Database Monitoring                │
└─────────────────────────────────────────────────────────┘
                           │
        ┌────────────────────┬────────────────────┬────────────────────┐
        │   Performance    │   Availability   │   Security       │
        │                 │                   │                   │
        │ • Query Time    │ • Uptime        │ • Access Logs    │
        │ • Connection    │ • Replication    │ • Audit Trail    │
        │ • Index Usage   │ • Failover      │ • Data Encrypt   │
        │ • Lock Analysis │ • Backups        │ • User Permissions│
        └────────────────────┴────────────────────┴────────────────────┘
```

## Integration Architecture

### External System Integration
```
┌─────────────────────────────────────────────────────────┐
│            External System Integrations         │
└─────────────────────────────────────────────────────────┘
                           │
        ┌────────────────────┬────────────────────┬────────────────────┐
        │   Payment APIs   │   Email Service   │   Analytics      │
        │                 │                   │                   │
        │ • Transaction   │ • Notifications  │ • User Behavior   │
        │ • Settlement    │ • Alerts         │ • Performance    │
        │ • Compliance    │ • Templates       │ • Business Metrics│
        └────────────────────┴────────────────────┴────────────────────┘
```

This architecture documentation provides a comprehensive overview of the Trade Finance Blockchain Explorer system design, covering all major components and their interactions.
