# Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance
from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP, func, Boolean, Enum
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import enum


class AlertType(str, enum.Enum):
    DOCUMENT_HASH_MISMATCH = "DOCUMENT_HASH_MISMATCH"
    MISSING_LIFECYCLE_STAGE = "MISSING_LIFECYCLE_STAGE"
    DUPLICATE_LEDGER_ACTION = "DUPLICATE_LEDGER_ACTION"
    UNAUTHORIZED_ACTOR = "UNAUTHORIZED_ACTOR"
    SUSPICIOUS_TRANSACTION_PATTERN = "SUSPICIOUS_TRANSACTION_PATTERN"
    INTEGRITY_CHECK_FAILURE = "INTEGRITY_CHECK_FAILURE"
    COMPLIANCE_VIOLATION = "COMPLIANCE_VIOLATION"


class AlertStatus(str, enum.Enum):
    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"


class Severity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ComplianceAlert(Base):
    __tablename__ = "compliance_alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(Enum(AlertType, name='alert_type'), nullable=False)
    severity = Column(Enum(Severity, name='severity'), nullable=False, default=Severity.MEDIUM)
    status = Column(Enum(AlertStatus, name='alert_status'), nullable=False, default=AlertStatus.OPEN)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    trade_id = Column(Integer, ForeignKey("trade_transactions.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    ledger_entry_id = Column(Integer, ForeignKey("ledger_entries.id", ondelete="SET NULL"), nullable=True)
    detected_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    resolved_at = Column(TIMESTAMP, nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolution_notes = Column(Text, nullable=True)

    # Relationships
    document = relationship("Document")
    trade = relationship("TradeTransaction")
    user = relationship("User", foreign_keys=[user_id])
    ledger_entry = relationship("LedgerEntry")
    resolver = relationship("User", foreign_keys=[resolved_by])
