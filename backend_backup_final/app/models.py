from sqlalchemy import Column, Integer, String, Enum, ForeignKey, Numeric, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
import enum

from .database import Base

# ------------------------
# ENUMS
# ------------------------


class UserRole(str, enum.Enum):
    bank = "bank"
    corporate = "corporate"
    auditor = "auditor"
    admin = "admin"


class DocumentType(str, enum.Enum):
    LOC = "LOC"
    INVOICE = "INVOICE"
    BILL_OF_LADING = "BILL_OF_LADING"
    PO = "PO"
    COO = "COO"
    INSURANCE_CERT = "INSURANCE_CERT"


class LedgerAction(str, enum.Enum):
    ISSUED = "ISSUED"
    AMENDED = "AMENDED"
    SHIPPED = "SHIPPED"
    RECEIVED = "RECEIVED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"
    VERIFIED = "VERIFIED"


class TransactionStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    disputed = "disputed"


# ------------------------
# MODELS
# ------------------------


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    org_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    doc_type = Column(Enum(DocumentType), nullable=False)
    doc_number = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    hash = Column(String, nullable=False)
    issued_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User")


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    action = Column(Enum(LedgerAction), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"))
    event_metadata = Column(JSONB)
    previous_hash = Column(String)
    current_hash = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document")
    actor = relationship("User")


class TradeTransaction(Base):
    __tablename__ = "trade_transactions"

    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"))
    seller_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Numeric, nullable=False)
    currency = Column(String(3), nullable=False)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.pending)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Numeric, nullable=False)
    rationale = Column(Text)
    last_updated = Column(DateTime, default=datetime.utcnow)


class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action_type = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(Integer, nullable=True)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
