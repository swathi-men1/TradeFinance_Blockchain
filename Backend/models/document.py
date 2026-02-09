from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    doc_type = Column(String)
    doc_number = Column(String)
    file_url = Column(String)
    hash = Column(String)
    issued_at = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
