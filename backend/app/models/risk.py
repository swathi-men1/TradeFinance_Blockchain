# Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance
from sqlalchemy import Column, Integer, Numeric, Text, ForeignKey, TIMESTAMP, func, CheckConstraint, String
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class RiskScore(Base):
    __tablename__ = "risk_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    score = Column(Numeric(5, 2), nullable=False)
    category = Column(String(20), nullable=False, default="MEDIUM")  # LOW, MEDIUM, HIGH
    rationale = Column(Text, nullable=False)
    last_updated = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    
    __table_args__ = (
        CheckConstraint('score >= 0 AND score <= 100', name='score_range_check'),
    )
    
    # Relationships
    user = relationship("User", backref="risk_score")
