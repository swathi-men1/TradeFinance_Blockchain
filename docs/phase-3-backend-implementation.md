# Trade Finance Blockchain Explorer
## Phase 3 – Backend Implementation (FastAPI)

---

## 1. Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app entry point
│   ├── config.py                  # Environment config
│   │
│   ├── api/                       # API routes
│   │   ├── __init__.py
│   │   ├── deps.py                # Dependencies (JWT validation, DB session)
│   │   ├── auth.py                # POST /auth/register, /auth/login
│   │   ├── documents.py           # Document CRUD + upload
│   │   ├── ledger.py              # Ledger entries
│   │   └── users.py               # User profile (optional)
│   │
│   ├── core/                      # Core utilities
│   │   ├── __init__.py
│   │   ├── security.py            # Password hashing, JWT creation
│   │   └── hashing.py             # SHA-256 file hashing
│   │
│   ├── db/                        # Database
│   │   ├── __init__.py
│   │   ├── session.py             # SQLAlchemy engine & session
│   │   ├── base.py                # Base model class
│   │   └── init_db.py             # Database initialization
│   │
│   ├── models/                    # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── user.py                # User model
│   │   ├── document.py            # Document model
│   │   ├── ledger.py              # LedgerEntry model
│   │   ├── trade.py               # TradeTransaction model
│   │   ├── risk.py                # RiskScore model
│   │   └── audit.py               # AuditLog model
│   │
│   ├── schemas/                   # Pydantic schemas (request/response)
│   │   ├── __init__.py
│   │   ├── user.py                # UserCreate, UserResponse, Token
│   │   ├── document.py            # DocumentCreate, DocumentResponse
│   │   └── ledger.py              # LedgerEntryCreate, LedgerEntryResponse
│   │
│   └── services/                  # Business logic
│       ├── __init__.py
│       ├── auth_service.py        # Registration, login logic
│       ├── document_service.py    # Document upload, S3 interaction
│       └── ledger_service.py      # Ledger entry creation
│
├── alembic/                       # Database migrations
│   ├── versions/
│   └── env.py
│
├── tests/                         # Unit & integration tests
│   ├── __init__.py
│   ├── test_auth.py
│   └── test_documents.py
│
├── .env                           # Environment variables (gitignored)
├── .env.example                   # Template for .env
├── requirements.txt               # Python dependencies
├── alembic.ini                    # Alembic config
└── README.md                      # Backend setup instructions
```

**Design Principles:**
- **Layered architecture**: API → Service → Model
- **Dependency injection**: Use FastAPI's `Depends()` for DB sessions, auth
- **Separation of concerns**: Models (data), Schemas (validation), Services (logic)
- **Single responsibility**: Each module has one clear purpose

---

## 2. Dependencies (requirements.txt)

```txt
# FastAPI Framework
fastapi==0.109.0
uvicorn[standard]==0.27.0

# Database
sqlalchemy==2.0.25
psycopg2-binary==2.9.9
alembic==1.13.1

# Authentication
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6

# Environment Management
python-dotenv==1.0.0

# File Upload & Storage
boto3==1.34.22                # AWS S3 SDK
python-magic==0.4.27          # File type detection

# Validation
pydantic==2.5.3
pydantic-settings==2.1.0
email-validator==2.1.0

# Development & Testing
pytest==7.4.4
pytest-asyncio==0.23.3
httpx==0.26.0                 # Async HTTP client for tests
```

**Installation:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

---

## 3. Environment Configuration

### .env.example (Template)

```bash
# Application
APP_NAME="Trade Finance Blockchain Explorer"
DEBUG=True
API_V1_PREFIX="/api/v1"

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/trade_finance
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# JWT Authentication
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15

# S3 / Object Storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=trade-finance-documents
S3_ENDPOINT_URL=  # Leave empty for AWS, set for MinIO/localstack

# CORS (for frontend)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### config.py

```python
# app/config.py
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # App
    APP_NAME: str = "Trade Finance Blockchain Explorer"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    
    # Database
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    
    # S3
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str
    S3_ENDPOINT_URL: str | None = None
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

---

## 4. Database Session Management

### db/session.py

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings

# Create engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,  # Verify connection before use
    echo=settings.DEBUG   # Log SQL in debug mode
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency for route handlers
def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### db/base.py

```python
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    """Base class for all models"""
    pass
```

---

## 5. SQLAlchemy Models (Exact Mapping to Phase 2)

### models/user.py

```python
from sqlalchemy import Column, Integer, String, Enum, TIMESTAMP, func
from app.db.base import Base
import enum

class UserRole(str, enum.Enum):
    BANK = "bank"
    CORPORATE = "corporate"
    AUDITOR = "auditor"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)  # Hashed
    role = Column(Enum(UserRole), nullable=False)
    org_name = Column(String(255), nullable=False, index=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
```

### models/document.py

```python
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum

class DocumentType(str, enum.Enum):
    LOC = "LOC"
    INVOICE = "INVOICE"
    BILL_OF_LADING = "BILL_OF_LADING"
    PO = "PO"
    COO = "COO"
    INSURANCE_CERT = "INSURANCE_CERT"

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    doc_type = Column(Enum(DocumentType), nullable=False)
    doc_number = Column(String(100), nullable=False)
    file_url = Column(String(500), nullable=False)
    hash = Column(String(64), nullable=False)  # SHA-256
    issued_at = Column(TIMESTAMP, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    
    # Relationships
    owner = relationship("User", backref="documents")
    ledger_entries = relationship("LedgerEntry", back_populates="document", cascade="all, delete-orphan")
```

### models/ledger.py

```python
from sqlalchemy import Column, Integer, Enum, ForeignKey, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum

class LedgerAction(str, enum.Enum):
    ISSUED = "ISSUED"
    AMENDED = "AMENDED"
    SHIPPED = "SHIPPED"
    RECEIVED = "RECEIVED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"
    VERIFIED = "VERIFIED"

class LedgerEntry(Base):
    __tablename__ = "ledger_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    action = Column(Enum(LedgerAction), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    metadata = Column(JSONB, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    
    # Relationships
    document = relationship("Document", back_populates="ledger_entries")
    actor = relationship("User", backref="ledger_actions")
```

**Design Notes:**
- `actor_id` is **nullable** to preserve ledger integrity when users are deleted
- `ON DELETE SET NULL` ensures ledger entries remain even after user deletion
- Ledger remains append-only (no UPDATE/DELETE operations)
- If user is deleted, `actor_id` becomes NULL but the action record persists for audit compliance

### models/trade.py

```python
from sqlalchemy import Column, Integer, String, Numeric, Enum, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum

class TradeStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DISPUTED = "disputed"

class TradeTransaction(Base):
    __tablename__ = "trade_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), nullable=False)
    status = Column(Enum(TradeStatus), nullable=False, default=TradeStatus.PENDING)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    buyer = relationship("User", foreign_keys=[buyer_id], backref="purchases")
    seller = relationship("User", foreign_keys=[seller_id], backref="sales")
```

### models/risk.py

```python
from sqlalchemy import Column, Integer, Numeric, Text, ForeignKey, TIMESTAMP, func, CheckConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base

class RiskScore(Base):
    __tablename__ = "risk_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    score = Column(Numeric(5, 2), nullable=False)
    rationale = Column(Text, nullable=False)
    last_updated = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    
    __table_args__ = (
        CheckConstraint('score >= 0 AND score <= 100', name='score_range_check'),
    )
    
    # Relationships
    user = relationship("User", backref="risk_score")
```

**MVP Status:** ⚠️ **Week 7** (Model defined but UNUSED in Phase 3)

**Phase 3 Implementation Notes:**
- RiskScore table is created via Alembic migrations
- NO API endpoints expose or modify risk scores in MVP (Weeks 1-4)
- Risk scoring logic will be implemented in Week 7
- For now, the table remains empty

### models/audit.py

```python
from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship
from app.db.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(Text, nullable=False)
    target_type = Column(String(50), nullable=True)
    target_id = Column(Integer, nullable=True)
    timestamp = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    
    # Relationships
    admin = relationship("User", backref="audit_actions")
```

---

## 6. Pydantic Schemas (Request/Response Validation)

### schemas/user.py

```python
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from app.models.user import UserRole

# Request schemas
class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: UserRole
    org_name: str = Field(..., min_length=1, max_length=255)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Response schemas
class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    org_name: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: int
    email: str
    role: UserRole
    org_name: str
```

### schemas/document.py

```python
from pydantic import BaseModel, Field
from datetime import datetime
from app.models.document import DocumentType

# Request schemas
class DocumentCreate(BaseModel):
    doc_type: DocumentType
    doc_number: str = Field(..., max_length=100)
    issued_at: datetime

# Response schemas
class DocumentResponse(BaseModel):
    id: int
    owner_id: int
    doc_type: DocumentType
    doc_number: str
    file_url: str
    hash: str
    issued_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True
```

### schemas/ledger.py

```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any
from app.models.ledger import LedgerAction

# Request schemas
class LedgerEntryCreate(BaseModel):
    document_id: int
    action: LedgerAction
    metadata: Optional[Dict[str, Any]] = None

# Response schemas
class LedgerEntryResponse(BaseModel):
    id: int
    document_id: int
    action: LedgerAction
    actor_id: Optional[int]
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True
```

---

## 7. JWT Authentication Flow

### core/security.py

```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a plain password"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

# JWT token creation
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
```

### Authentication Flow Diagram

```
CLIENT                    BACKEND                     DATABASE
  │                          │                           │
  │  POST /auth/register     │                           │
  ├─────────────────────────>│                           │
  │  {name, email, password} │                           │
  │                          │  Hash password (bcrypt)   │
  │                          │  INSERT INTO users        │
  │                          ├──────────────────────────>│
  │                          │<──────────────────────────┤
  │  201 Created             │  user_id                  │
  │<─────────────────────────┤                           │
  │                          │                           │
  │  POST /auth/login        │                           │
  ├─────────────────────────>│                           │
  │  {email, password}       │  SELECT * FROM users      │
  │                          │  WHERE email = ?          │
  │                          ├──────────────────────────>│
  │                          │<──────────────────────────┤
  │                          │  user record              │
  │                          │  Verify password          │
  │                          │  Create JWT token:        │
  │                          │  {user_id, role, org}     │
  │  200 OK                  │                           │
  │  {access_token: "..."}   │                           │
  │<─────────────────────────┤                           │
  │                          │                           │
  │  GET /api/v1/documents   │                           │
  │  Header: Authorization   │  Decode JWT token         │
  │  Bearer eyJhbGci...      │  Extract user_id, role    │
  ├─────────────────────────>│                           │
  │                          │  Check role permission    │
  │                          │  SELECT * FROM documents  │
  │                          │  WHERE owner_id = ?       │
  │                          ├──────────────────────────>│
  │                          │<──────────────────────────┤
  │  200 OK                  │  documents[]              │
  │  [documents]             │                           │
  │<─────────────────────────┤                           │
```

---

## 8. Dependency Injection (Auth & DB)

### api/deps.py

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole
from app.schemas.user import TokenData

# HTTP Bearer token scheme
security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Extract and validate current user from JWT token"""
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: int = payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

def require_roles(allowed_roles: List[UserRole]):
    """Dependency to check if user has required role"""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {allowed_roles}"
            )
        return current_user
    return role_checker
```

**Usage in routes:**
```python
from app.api.deps import get_current_user, require_roles
from app.models.user import UserRole

@router.get("/documents")
def list_documents(
    current_user: User = Depends(get_current_user),  # Any authenticated user
    db: Session = Depends(get_db)
):
    ...

@router.post("/documents")
def upload_document(
    current_user: User = Depends(require_roles([UserRole.BANK, UserRole.CORPORATE])),
    db: Session = Depends(get_db)
):
    ...
```

---

## 9. API Endpoints (MVP - Weeks 1-4)

### Module A: Authentication (Week 1-2)

| Method | Endpoint            | Description              | Auth Required | Roles          |
|--------|---------------------|--------------------------|---------------|----------------|
| POST   | /api/v1/auth/register | Create new user account | ❌            | -              |
| POST   | /api/v1/auth/login    | Login, get JWT token    | ❌            | -              |
| GET    | /api/v1/auth/me       | Get current user info   | ✅            | All            |

**api/auth.py (Excerpt):**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.db.session import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.services.auth_service import AuthService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    return AuthService.register_user(db, user_data)

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login and receive JWT token"""
    return AuthService.login_user(db, credentials)

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info"""
    return current_user
```

---

### Module B: Documents (Week 3)

| Method | Endpoint                     | Description                  | Auth Required | Roles                      |
|--------|------------------------------|------------------------------|---------------|----------------------------|
| POST   | /api/v1/documents/upload     | Upload document file         | ✅            | bank, corporate, admin     |
| GET    | /api/v1/documents            | List user's documents        | ✅            | All (scoped by role)       |
| GET    | /api/v1/documents/{id}       | Get document details         | ✅            | All (scoped by role)       |
| GET    | /api/v1/documents/{id}/verify| Verify document hash         | ✅            | All                        |

**api/documents.py (Excerpt):**

```python
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.document import DocumentCreate, DocumentResponse
from app.services.document_service import DocumentService
from app.api.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.document import DocumentType
from datetime import datetime

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    doc_type: DocumentType = Form(...),
    doc_number: str = Form(...),
    issued_at: datetime = Form(...),
    current_user: User = Depends(require_roles([UserRole.BANK, UserRole.CORPORATE, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Upload a trade finance document"""
    return await DocumentService.upload_document(db, current_user, file, doc_type, doc_number, issued_at)

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List documents (scoped by user role)"""
    return DocumentService.list_documents(db, current_user)

@router.get("/{document_id}/verify")
def verify_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify document hash integrity"""
    return DocumentService.verify_document_hash(db, current_user, document_id)
```

---

### Module C: Ledger (Week 4)

| Method | Endpoint                              | Description                  | Auth Required | Roles                      |
|--------|---------------------------------------|------------------------------|---------------|----------------------------|
| POST   | /api/v1/ledger/entries                | Create ledger entry          | ✅            | bank, corporate, admin     |
| GET    | /api/v1/ledger/documents/{doc_id}     | Get ledger timeline for doc  | ✅            | All (scoped by role)       |

**api/ledger.py (Excerpt):**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.ledger import LedgerEntryCreate, LedgerEntryResponse
from app.services.ledger_service import LedgerService
from app.api.deps import get_current_user, require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/ledger", tags=["Ledger"])

@router.post("/entries", response_model=LedgerEntryResponse, status_code=201)
def create_ledger_entry(
    entry: LedgerEntryCreate,
    current_user: User = Depends(require_roles([UserRole.BANK, UserRole.CORPORATE, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Create a new ledger entry for a document"""
    return LedgerService.create_entry(db, current_user, entry)

@router.get("/documents/{document_id}", response_model=List[LedgerEntryResponse])
def get_document_ledger(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get ledger timeline for a specific document"""
    return LedgerService.get_document_timeline(db, current_user, document_id)
```

---

## 10. Business Logic Services

### services/auth_service.py

```python
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, Token
from app.core.security import hash_password, verify_password, create_access_token
from datetime import timedelta
from app.config import settings

class AuthService:
    @staticmethod
    def register_user(db: Session, user_data: UserCreate) -> User:
        """Register a new user"""
        # Check if email exists
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user
        hashed_password = hash_password(user_data.password)
        new_user = User(
            name=user_data.name,
            email=user_data.email,
            password=hashed_password,
            role=user_data.role,
            org_name=user_data.org_name
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    
    @staticmethod
    def login_user(db: Session, credentials: UserLogin) -> Token:
        """Authenticate user and return JWT token"""
        # Find user
        user = db.query(User).filter(User.email == credentials.email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Verify password
        if not verify_password(credentials.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Create JWT token
        token_data = {
            "user_id": user.id,
            "email": user.email,
            "role": user.role.value,
            "org_name": user.org_name
        }
        access_token = create_access_token(
            data=token_data,
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        return Token(access_token=access_token)
```

### services/document_service.py

```python
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile
from app.models.document import Document, DocumentType
from app.models.user import User, UserRole
from app.models.ledger import LedgerEntry, LedgerAction
from app.core.hashing import compute_file_hash
from datetime import datetime
import boto3
from app.config import settings

class DocumentService:
    @staticmethod
    async def upload_document(
        db: Session,
        current_user: User,
        file: UploadFile,
        doc_type: DocumentType,
        doc_number: str,
        issued_at: datetime
    ) -> Document:
        """Upload document to S3 and create database record"""
        # NOTE: Loading entire file into memory is acceptable for MVP
        # TODO (Post-MVP): Stream large files to S3 to reduce memory usage
        file_contents = await file.read()
        
        # Compute SHA-256 hash
        file_hash = compute_file_hash(file_contents)
        
        # NOTE: Creating S3 client per request is acceptable for MVP
        # TODO (Post-MVP): Move to shared S3 client or dependency injection
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
            endpoint_url=settings.S3_ENDPOINT_URL
        )
        
        s3_key = f"documents/{current_user.org_name}/{file_hash[:8]}_{file.filename}"
        s3_client.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=s3_key,
            Body=file_contents
        )
        
        # Create document record
        document = Document(
            owner_id=current_user.id,
            doc_type=doc_type,
            doc_number=doc_number,
            file_url=s3_key,
            hash=file_hash,
            issued_at=issued_at
        )
        db.add(document)
        db.commit()
        db.refresh(document)
        
        # Create initial ledger entry (ISSUED)
        ledger_entry = LedgerEntry(
            document_id=document.id,
            action=LedgerAction.ISSUED,
            actor_id=current_user.id,
            metadata={"filename": file.filename}
        )
        db.add(ledger_entry)
        db.commit()
        
        return document
    
    @staticmethod
    def list_documents(db: Session, current_user: User):
        """List documents based on user role"""
        query = db.query(Document)
        
        # Auditors and admins see all documents
        if current_user.role in [UserRole.AUDITOR, UserRole.ADMIN]:
            return query.all()
        
        # Others see only their own documents
        return query.filter(Document.owner_id == current_user.id).all()
    
    @staticmethod
    def verify_document_hash(db: Session, current_user: User, document_id: int):
        """Verify document hash against S3 file"""
        # Get document
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Authorization check: Allow admin, auditor, or document owner only
        is_authorized = (
            current_user.role in [UserRole.ADMIN, UserRole.AUDITOR] or
            document.owner_id == current_user.id
        )
        
        if not is_authorized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only verify your own documents."
            )
        
        # Download file from S3
        # NOTE: Creating S3 client per request is acceptable for MVP
        # TODO (Post-MVP): Move to shared S3 client or connection pool
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        
        response = s3_client.get_object(Bucket=settings.S3_BUCKET_NAME, Key=document.file_url)
        
        # NOTE: Loading entire file into memory is acceptable for MVP
        # TODO (Post-MVP): Stream large files or implement chunk-based hashing
        file_contents = response['Body'].read()
        
        # Re-compute hash
        current_hash = compute_file_hash(file_contents)
        
        # Compare
        is_valid = (current_hash == document.hash)
        
        # Create VERIFIED ledger entry
        if is_valid:
            ledger_entry = LedgerEntry(
                document_id=document.id,
                action=LedgerAction.VERIFIED,
                actor_id=current_user.id,
                metadata={"verification_result": "valid"}
            )
            db.add(ledger_entry)
            db.commit()
        
        return {
            "document_id": document_id,
            "stored_hash": document.hash,
            "current_hash": current_hash,
            "is_valid": is_valid
        }
```

### core/hashing.py

```python
import hashlib

def compute_file_hash(file_contents: bytes) -> str:
    """Compute SHA-256 hash of file contents"""
    sha256_hash = hashlib.sha256()
    sha256_hash.update(file_contents)
    return sha256_hash.hexdigest()
```

---

## 11. Main Application Entry Point

### main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import auth, documents, ledger

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(documents.router, prefix=settings.API_V1_PREFIX)
app.include_router(ledger.router, prefix=settings.API_V1_PREFIX)

@app.get("/")
def root():
    return {
        "message": "Trade Finance Blockchain Explorer API",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
```

**CRITICAL: Database schema MUST be created via Alembic migrations, NOT `create_all()`**

**Setup database (first time):**
```bash
# Run migrations to create tables
alembic upgrade head
```

**Run the application:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 12. What to Implement Now vs Later

### ✅ Implement Now (Weeks 1-4 MVP)

**Week 1-2: Foundation**
- [x] Project structure
- [x] Database models (all 6 tables)
- [x] Environment configuration
- [x] User registration endpoint
- [x] Login endpoint (JWT access token)
- [x] JWT validation middleware
- [x] Role-based access control decorator
- [x] Audit logs for admin actions

**Week 3: Document Management**
- [x] Document upload API
- [x] SHA-256 hash computation
- [x] S3 file storage integration
- [x] List documents API (role-scoped)
- [x] Get document details API
- [x] Automatic ISSUED ledger entry creation

**Week 4: Ledger & Verification**
- [x] Create ledger entry API
- [x] Get document timeline API
- [x] Verify document hash API
- [x] VERIFIED ledger entry on successful verification

---

### ⚠️ Defer to Later Sprints

**Week 3+ Enhancements:**
- [ ] Refresh token rotation (access token sufficient for MVP)
- [ ] Token blacklist for logout (stateless JWT acceptable for MVP)
- [ ] Rate limiting (defer until production deployment)

**Week 5: Trade Transactions**
- [ ] Create trade API
- [ ] Update trade status API
- [ ] List trades API (role-scoped)
- [ ] Link trades to documents (join table)

**Week 6: Background Jobs**
- [ ] Celery worker setup
- [ ] Automated integrity check task (periodic)
- [ ] Alert admin on hash mismatch

**Week 7: Risk Scoring**
- [ ] Risk score calculation logic
- [ ] Calculate risk score API
- [ ] Get user risk score API
- [ ] Mock UNCTAD/WTO data integration

**Week 8: Analytics**
- [ ] Dashboard KPIs API
- [ ] CSV export endpoint
- [ ] PDF report generation

**Post-Week 8:**
- [ ] Email notifications (not in PDF spec)
- [ ] Two-factor authentication (enhancement)
- [ ] Real-time WebSocket updates (enhancement)
- [ ] Advanced search/filtering (enhancement)

---

## 13. Database Migrations (Alembic)

### Setup Alembic

```bash
cd backend
alembic init alembic
```

### alembic.ini (Update)

```ini
sqlalchemy.url = postgresql://postgres:password@localhost:5432/trade_finance
```

### alembic/env.py (Update)

```python
from app.db.base import Base
from app.models.user import User
from app.models.document import Document
from app.models.ledger import LedgerEntry
from app.models.trade import TradeTransaction
from app.models.risk import RiskScore
from app.models.audit import AuditLog

target_metadata = Base.metadata
```

### Create Initial Migration

```bash
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head
```

---

## 14. Testing Strategy (Brief Overview)

### tests/test_auth.py (Example)

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_register_user():
    response = client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "securepass123",
        "role": "corporate",
        "org_name": "Test Corp"
    })
    assert response.status_code == 201
    assert "id" in response.json()

def test_login_user():
    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "securepass123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
```

**Run tests:**
```bash
pytest tests/ -v
```

---

## 15. Security Best Practices

### Implemented in MVP:

1. **Password Hashing**: bcrypt with auto-generated salt
2. **JWT Tokens**: Short expiration (15 min), signed with secret key
3. **HTTPS Only**: Enforce in production (set `secure=True` for cookies)
4. **CORS**: Whitelist specific origins only
5. **SQL Injection Prevention**: SQLAlchemy ORM parameterized queries
6. **Input Validation**: Pydantic schemas validate all inputs
7. **Role-Based Access**: Enforced at API layer
8. **Audit Logging**: All admin actions logged

### To Add Later:

- [ ] Rate limiting (prevent brute force)
- [ ] Refresh token rotation
- [ ] CSRF protection (for cookie-based auth)
- [ ] Security headers (Helmet.js equivalent)
- [ ] File upload size limits
- [ ] Virus scanning for uploaded files

---

## 16. Acceptable Technical Debt (MVP)

The following implementation choices are **acceptable for MVP** and should NOT be refactored until post-Week 4:

### ✅ Acceptable in Phase 3:

1. **S3 Client Creation per Request**
   - Current: `boto3.client()` instantiated in each service method
   - Why acceptable: Simpler code, no connection pool management needed
   - When to refactor: Week 6+ when performance profiling shows overhead
   - Future approach: Shared S3 client as application dependency

2. **Loading Files into Memory**
   - Current: `file_contents = await file.read()` loads entire file
   - Why acceptable: Trade finance documents typically < 10MB
   - When to refactor: Week 6+ if large files (>50MB) become common
   - Future approach: Streaming upload/download with chunk-based hashing

3. **No Request Rate Limiting**
   - Current: Endpoints have no rate limits
   - Why acceptable: Internal system with trusted users for MVP
   - When to refactor: Pre-production deployment (Week 8)
   - Future approach: Redis-based rate limiting middleware

4. **Synchronous Database Queries**
   - Current: SQLAlchemy synchronous ORM (`db.query()`)
   - Why acceptable: CRUD operations are fast, no complex analytics yet
   - When to refactor: Week 8+ if response times > 500ms
   - Future approach: AsyncIO with `asyncpg` and SQLAlchemy async

5. **No File Type Validation**
   - Current: Accepts any file upload without MIME type verification
   - Why acceptable: Trusted users in controlled environment
   - When to refactor: Week 5 when implementing file download preview
   - Future approach: `python-magic` library for content type detection

6. **Simple Error Messages**
   - Current: Generic error messages (e.g., "Document not found")
   - Why acceptable: Sufficient for development and testing
   - When to refactor: Week 7 when preparing for external audit
   - Future approach: Structured error codes with detailed messages

### ❌ NOT Acceptable (Must Fix Before Production):

- Hardcoded secrets in code (use environment variables)
- SQL injection vulnerabilities (use ORM parameterized queries)
- Missing authentication on protected routes
- Exposing sensitive data in responses (passwords, internal IDs)

---



**Next Phase:** Phase 4 – Frontend Implementation (React + Tailwind, role-based routing, API integration)