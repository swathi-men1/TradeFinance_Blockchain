# Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance
from sqlalchemy import Column, Integer, String, Numeric, Enum, ForeignKey, TIMESTAMP, func, Table
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import enum

# Association table for Trade-Document many-to-many relationship
trade_documents = Table(
    'trade_documents',
    Base.metadata,
    Column('trade_id', Integer, ForeignKey('trade_transactions.id', ondelete='CASCADE'), primary_key=True),
    Column('document_id', Integer, ForeignKey('documents.id', ondelete='CASCADE'), primary_key=True),
    Column('linked_at', TIMESTAMP, server_default=func.now(), nullable=False)
)


class TradeStatus(enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    PAID = "paid"
    DISPUTED = "disputed"


class TradeTransaction(Base):
    __tablename__ = "trade_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), nullable=False)
    status = Column(
        Enum(TradeStatus, name='trade_status', values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=TradeStatus.PENDING.value
    )
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    buyer = relationship("User", foreign_keys=[buyer_id], backref="purchases")
    seller = relationship("User", foreign_keys=[seller_id], backref="sales")
    documents = relationship("Document", secondary=trade_documents, backref="trades")
