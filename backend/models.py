from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True)
    filename = Column(String)
    file_hash = Column(String)
    owner_email = Column(String)
    status = Column(String, default="PENDING")

    ledger = relationship(
        "LedgerEntry",
        back_populates="document",
        cascade="all, delete"
    )

class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"))
    action = Column(String)
    actor_email = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="ledger")
