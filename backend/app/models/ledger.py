import uuid
import hashlib
from sqlalchemy import Column, String, TIMESTAMP, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # 🔹 What entity this ledger entry belongs to (DOCUMENT / TRADE / USER etc.)
    entity_type = Column(String, nullable=False)

    # 🔹 ID of that entity
    entity_id = Column(UUID(as_uuid=True), nullable=False)

    # 🔹 Blockchain linking
    previous_hash = Column(String(64), nullable=True)
    current_hash = Column(String(64), nullable=False)

    # 🔹 What action happened
    action = Column(String, nullable=False)

    # 🔹 Who performed the action (User ID)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # 🔹 Human-readable explanation
    description = Column(String, nullable=True)

    created_at = Column(TIMESTAMP, server_default=func.now())
