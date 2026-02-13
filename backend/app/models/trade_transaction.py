import uuid
from sqlalchemy import Column, String, Integer, Float, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class TradeTransaction(Base):
    __tablename__ = "trade_transactions"

    # 🔹 Trade ID (UUID)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # 🔹 Buyer & Seller → MUST match users.id (Integer)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    amount = Column(Float, nullable=False)
    currency = Column(String, nullable=False)

    status = Column(String, nullable=False, default="pending")

    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
