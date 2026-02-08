from pydantic import BaseModel
from typing import List
from datetime import datetime
from decimal import Decimal

class RiskScoreResponse(BaseModel):
    user_id: int
    score: Decimal
    category: str
    rationale: str
    last_updated: datetime
    
    class Config:
        from_attributes = True

class RiskRecalculationResponse(BaseModel):
    status: str
    total_processed: int
    message: str
