from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime
from database import Base


# ================= USER TABLE =================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)


# ================= DOCUMENT TABLE =================
class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    owner_email = Column(String)
    filename = Column(String)
    file_path = Column(String)
    file_hash = Column(String)

    status = Column(String, default="PENDING")
    access_role = Column(String, default="corporate")

    # Soft delete fields
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(String, nullable=True)
    delete_reason = Column(Text, nullable=True)


# ================= LEDGER TABLE =================
class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(Integer, primary_key=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    timestamp = Column(DateTime, default=datetime.utcnow)

    document_id = Column(Integer, ForeignKey("documents.id"))
    action = Column(String)
    actor_email = Column(String)

    event_data = Column(JSON, nullable=True)
