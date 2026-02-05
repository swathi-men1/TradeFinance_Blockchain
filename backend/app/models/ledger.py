import uuid
from sqlalchemy import Column, String, TIMESTAMP, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    entity_type = Column(String, nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)

    previous_hash = Column(String(64), nullable=True)
    current_hash = Column(String(64), nullable=False)

    action = Column(String, nullable=False)

    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(TIMESTAMP, server_default=func.now())
