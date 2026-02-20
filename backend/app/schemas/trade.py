from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from app.models.trade import TradeStatus


# Request schemas
class TradeCreate(BaseModel):
    buyer_id: int = Field(..., description="Buyer user ID")
    seller_id: int = Field(..., description="Seller user ID")
    amount: Decimal = Field(..., gt=0, description="Trade amount (must be positive)")
    currency: str = Field(..., min_length=3, max_length=3, description="3-letter currency code (e.g., USD)")


class TradeStatusUpdate(BaseModel):
    status: TradeStatus = Field(..., description="New trade status")


class TradeLinkDocument(BaseModel):
    document_id: int = Field(..., description="Document ID to link to trade")


from app.schemas.user import UserResponse

# Response schemas
class TradeResponse(BaseModel):
    id: int
    buyer_id: int
    seller_id: int
    buyer: UserResponse
    seller: UserResponse
    amount: Decimal
    currency: str
    status: TradeStatus
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        use_enum_values = True


class TradeDetailResponse(TradeResponse):
    """Extended trade response with buyer/seller details and linked documents"""
    buyer_name: Optional[str] = None
    buyer_org: Optional[str] = None
    seller_name: Optional[str] = None
    seller_org: Optional[str] = None
    document_count: int = 0
    
    class Config:
        from_attributes = True
