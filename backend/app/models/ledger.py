import uuid
from sqlalchemy import Column, String, TIMESTAMP, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    # Primary key (UUID) – correct
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # What entity this ledger entry refers to (e.g. "document")
    entity_type = Column(String, nullable=False)

    # Refers to documents.id (UUID) – correct
    entity_id = Column(UUID(as_uuid=True), nullable=False)

    # Hash chaining
    previous_hash = Column(String(64), nullable=True)
    current_hash = Column(String(64), nullable=False)

    # Action metadata
    action = Column(String, nullable=False)  # UPLOAD / VERIFY / TAMPER_CHECK

    # Actor → users.id (INTEGER) ✅ FIXED
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Timestamp
    created_at = Column(TIMESTAMP, server_default=func.now())
