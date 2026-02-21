from sqlalchemy import Column, Integer, String, DateTime
from database.init_db import Base
from datetime import datetime

class TradeTransaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    buyer_email = Column(String, nullable=False)
    seller_email = Column(String, nullable=False)
    status = Column(String, default="CREATED")
    created_at = Column(DateTime, default=datetime.utcnow)
