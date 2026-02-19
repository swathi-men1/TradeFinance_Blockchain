# Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from decimal import Decimal


class RiskScoreResponse(BaseModel):
    """
    Response model for risk score.
    
    Includes all mentor-required fields:
    - user_id: The user this score belongs to
    - score: Numeric score 0-100
    - category: LOW / MEDIUM / HIGH
    - rationale: Human-readable explanation
    - last_updated: Timestamp of calculation
    """
    user_id: int
    user_name: Optional[str] = None
    user_role: Optional[str] = None
    organization: Optional[str] = None
    score: float
    category: str  # LOW, MEDIUM, HIGH
    rationale: str
    last_updated: datetime
    
    class Config:
        from_attributes = True


class RiskRecalculationResponse(BaseModel):
    """Response model for bulk recalculation."""
    status: str
    total_processed: int
    message: str


class RiskScoreSummary(BaseModel):
    """Summary model for admin dashboard (list view)."""
    user_id: int
    user_name: str
    user_org: Optional[str]
    score: float
    category: str
    last_updated: datetime
    
    class Config:
        from_attributes = True


class RiskCategoryDistribution(BaseModel):
    """Model for risk category distribution stats."""
    low_count: int
    medium_count: int
    high_count: int
    total_users: int


class RiskBreakdown(BaseModel):
    """Detailed breakdown of risk components."""
    document_risk: float
    activity_risk: float
    transaction_risk: float
    external_risk: float
    document_contribution: float
    activity_contribution: float
    transaction_contribution: float
    external_contribution: float
