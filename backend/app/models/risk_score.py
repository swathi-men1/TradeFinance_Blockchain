import uuid
from sqlalchemy import Column, Numeric, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base

class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)

    score = Column(Numeric, nullable=False)
    rationale = Column(Text)
    last_updated = Column(TIMESTAMP, server_default=func.now())
