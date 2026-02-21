from sqlalchemy import Column, Integer, String, DateTime
from database.init_db import Base
from datetime import datetime

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    document_type = Column(String)
    owner_email = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
