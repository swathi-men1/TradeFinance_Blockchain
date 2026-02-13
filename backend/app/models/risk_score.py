import uuid
from sqlalchemy import Column, Integer, Float, String, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base


class RiskScore(Base):
    __tablename__ = "risk_scores"

    # Primary key (UUID is fine here)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # MUST match users.id (INTEGER)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    score = Column(Float, nullable=False)
    rationale = Column(String, nullable=True)

    last_updated = Column(
        TIMESTAMP,
        server_default=func.now(),
        onupdate=func.now()
    )
