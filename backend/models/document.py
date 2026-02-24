from sqlalchemy import Column, Integer, String, DateTime
from database.init_db import Base
from datetime import datetime

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True)
    document_id = Column(String, unique=True, index=True)
    transaction_id = Column(Integer, index=True, nullable=True) # Link to Trade Transaction
    document_type = Column(String)
    uploaded_by = Column(Integer)
    s3_key = Column(String) # Replaces local file_path
    sha256_hash = Column(String)
    status = Column(String, default="UPLOADED")
    risk_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
