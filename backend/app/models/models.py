"""
SQLAlchemy models for database tables.
Defines the schema for all data entities.
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Enum
from datetime import datetime
from app.database.database import Base
import enum


class UserRole(str, enum.Enum):
    """User roles in the system."""
    ADMIN = "admin"
    BANK = "bank"
    CORPORATE = "corporate"
    AUDITOR = "auditor"


class User(Base):
    """User model - represents system users with roles."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(200))
    hashed_password = Column(String(500), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CORPORATE, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, role={self.role}, active={self.is_active})>"


class Document(Base):
    """Document model - represents uploaded trade documents."""
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    filename = Column(String(255), nullable=False)
    file_hash = Column(String(64), unique=True, nullable=False)  # SHA-256 hash
    file_size = Column(Integer)  # in bytes
    document_type = Column(String(50))  # invoice, po, lc, etc.
    status = Column(String(50), default="uploaded")  # uploaded, verified, rejected
    metadata = Column(Text)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Document(id={self.id}, filename={self.filename}, hash={self.file_hash[:16]}...)>"


class LedgerEntry(Base):
    """Ledger model - represents blockchain ledger entries."""
    __tablename__ = "ledger_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, nullable=False)
    transaction_id = Column(String(100), unique=True, nullable=False)
    action = Column(String(50))  # created, modified, verified, etc.
    actor_id = Column(Integer, nullable=False)  # User who performed the action
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(Text)  # JSON string with additional info
    
    def __repr__(self):
        return f"<LedgerEntry(id={self.id}, txn={self.transaction_id}, action={self.action})>"


class TradeTransaction(Base):
    """Trade transaction model - represents buy/sell transactions."""
    __tablename__ = "trade_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_code = Column(String(100), unique=True, nullable=False)
    buyer_id = Column(Integer, nullable=False)
    seller_id = Column(Integer, nullable=False)
    amount = Column(Integer)  # in cents/lowest unit
    currency = Column(String(10), default="USD")
    status = Column(String(50), default="pending")  # pending, approved, completed, cancelled
    document_id = Column(Integer)  # Associated document
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<TradeTransaction(code={self.transaction_code}, status={self.status})>"


class RiskScore(Base):
    """Risk score model - stores risk assessments."""
    __tablename__ = "risk_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, nullable=False)
    score = Column(Integer)  # 0-100
    risk_level = Column(String(20))  # low, medium, high, critical
    factors = Column(Text)  # JSON string with risk factors
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<RiskScore(txn_id={self.transaction_id}, score={self.score}, level={self.risk_level})>"
