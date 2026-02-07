from sqlalchemy import Column, Integer, Enum, ForeignKey, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.db.base import Base
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
    # Trade actions (Week 5)
    TRADE_CREATED = "TRADE_CREATED"
    TRADE_STATUS_UPDATED = "TRADE_STATUS_UPDATED"
    DOCUMENT_LINKED_TO_TRADE = "DOCUMENT_LINKED_TO_TRADE"
    TRADE_DISPUTED = "TRADE_DISPUTED"


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=True)
    action = Column(Enum(LedgerAction), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    entry_metadata = Column("metadata", JSONB, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    
    # Relationships
    document = relationship("Document", back_populates="ledger_entries")
    actor = relationship("User", backref="ledger_actions")
