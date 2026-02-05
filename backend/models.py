from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

# ================= USER =================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="corporate")

# ================= DOCUMENT =================
class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_hash = Column(String, nullable=False)
    owner_email = Column(String, nullable=False)
    status = Column(String, default="PENDING")

    ledger_entries = relationship(
        "LedgerEntry",
        back_populates="document",
        cascade="all, delete"
    )

# ================= LEDGER =================
class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(
        Integer,
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False
    )
    action = Column(String, nullable=False)
    actor_email = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="ledger_entries")
