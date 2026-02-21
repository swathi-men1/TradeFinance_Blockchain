from sqlalchemy import Column, Integer, Float, String, DateTime
import datetime
from models.base import Base

class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    score = Column(Float, nullable=False)
    level = Column(String, nullable=False)
    rationale = Column(String)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)
