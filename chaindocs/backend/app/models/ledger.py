from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime
from app.core.database import Base

class Ledger(Base):
    __tablename__ = "ledger"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    action = Column(String, nullable=False)
    hash = Column(String, nullable=False)
    performed_by = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    previous_hash = Column(String, nullable=True)
