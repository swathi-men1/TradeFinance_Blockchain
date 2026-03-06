from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
import datetime
from models.base import Base

class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    action = Column(String, nullable=False)
    actor_role = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
