# Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance
from sqlalchemy import Column, Integer, Enum, ForeignKey, TIMESTAMP, func, String, Boolean, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import enum


class LedgerAction(str, enum.Enum):
    # Document actions
    ISSUED = "ISSUED"
    AMENDED = "AMENDED"
    SHIPPED = "SHIPPED"
    RECEIVED = "RECEIVED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"
    VERIFIED = "VERIFIED"
    DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED"
    DOCUMENT_UPDATED = "DOCUMENT_UPDATED"
    DOCUMENT_DELETED = "DOCUMENT_DELETED"
    
    # Trade actions (Week 5)
    TRADE_CREATED = "TRADE_CREATED"
    TRADE_STATUS_UPDATED = "TRADE_STATUS_UPDATED"
    DOCUMENT_LINKED_TO_TRADE = "DOCUMENT_LINKED_TO_TRADE"
    DOCUMENT_UNLINKED_FROM_TRADE = "DOCUMENT_UNLINKED_FROM_TRADE"
    TRADE_DISPUTED = "TRADE_DISPUTED"
    TRADE_UPDATED = "TRADE_UPDATED"
    TRADE_DELETED = "TRADE_DELETED"
    
    # User Management actions
    USER_REGISTERED = "USER_REGISTERED"
    USER_APPROVED = "USER_APPROVED"
    USER_REJECTED = "USER_REJECTED"
    USER_UPDATED = "USER_UPDATED"
    USER_DELETED = "USER_DELETED"
    USER_ROLE_ASSIGNED = "USER_ROLE_ASSIGNED"
    
    # System actions
    RISK_SCORE_RECALCULATED = "RISK_SCORE_RECALCULATED"
    INTEGRITY_CHECK_COMPLETED = "INTEGRITY_CHECK_COMPLETED"
    LEDGER_ENTRY_CREATED = "LEDGER_ENTRY_CREATED"


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=True)
    action = Column(Enum(LedgerAction, name='ledger_action'), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    entry_metadata = Column("metadata", JSONB, nullable=True)
    previous_hash = Column(String(64), nullable=True)
    entry_hash = Column(String(64), nullable=True, unique=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    
    # Relationships
    document = relationship("Document", back_populates="ledger_entries")
    actor = relationship("User", backref="ledger_actions")


class IntegrityReport(Base):
    __tablename__ = "integrity_reports"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=True)
    status = Column(String(20), nullable=False)  # "VALID", "TAMPERED"
    error_message = Column(Text, nullable=True)
    checked_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)

    # Relationships
    document = relationship("Document")
