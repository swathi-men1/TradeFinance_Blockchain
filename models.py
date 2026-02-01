from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)

    filename = Column(String, nullable=False)
    file_hash = Column(String, nullable=False)
    file_path = Column(String, nullable=False)

    owner_email = Column(String, nullable=False)
    status = Column(String, nullable=False, default="PENDING")

    uploaded_at = Column(DateTime, default=datetime.utcnow)
