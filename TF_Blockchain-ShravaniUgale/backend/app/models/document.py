from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class TradeDocument(Base):
    __tablename__ = "trade_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    doc_type = Column(String, nullable=False)
    status = Column(String, default="Uploaded")
    org_name = Column(String, nullable=False)
    owner_email = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
