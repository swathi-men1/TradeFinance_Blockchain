from sqlalchemy import Column, Integer, String, Float, JSON, DateTime
from database.init_db import Base
from datetime import datetime

class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(Integer, unique=True, index=True) # User ID or Org ID
    score = Column(Float, default=100.0) # 0 (High Risk) - 100 (Safe)
    rationale = Column(String)
    history = Column(JSON, default=list) # Store historical score changes
    updated_at = Column(DateTime, default=datetime.utcnow)
