import uuid
from sqlalchemy import Column, String, Numeric, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base

class TradeTransaction(Base):
    __tablename__ = "trade_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    buyer_id = Column(UUID(as_uuid=True), nullable=False)
    seller_id = Column(UUID(as_uuid=True), nullable=False)

    amount = Column(Numeric, nullable=False)
    currency = Column(String(3), nullable=False)

    status = Column(String, default="pending")
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, onupdate=func.now())
