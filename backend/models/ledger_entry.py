from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from database.init_db import Base



class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String, index=True, nullable=True) # Can be null if entry is for a transaction only
    transaction_id = Column(Integer, index=True, nullable=True) # Link to Trade Transaction
    action = Column(String)          # UPLOAD / VERIFY / ISSUED / SHIPPED / ETC
    previous_hash = Column(String, default="0") # Blockchain Link
    entry_hash = Column(String)      # Current Hash
    actor_role = Column(String)      # corporate / auditor / admin
    performed_by = Column(Integer)   # user id
    timestamp = Column(DateTime, default=datetime.utcnow)

