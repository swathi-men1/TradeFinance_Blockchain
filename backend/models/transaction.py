from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from database.init_db import Base
from datetime import datetime

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, nullable=False)  # User ID of Corporate Buyer
    seller_id = Column(Integer, nullable=False) # User ID of Corporate Seller
    items = Column(String, nullable=True)       # Description of goods
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    status = Column(String, default="ISSUED")  # ISSUED, COMPLETED, DISPUTED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
