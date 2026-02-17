from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime


# ============================================================
# TRADE CREATE SCHEMA
# ============================================================

class TradeCreate(BaseModel):
    seller_id: int = Field(
        ...,
        description="ID of the counterparty/seller"
    )
    amount: float = Field(
        ...,
        gt=0,
        description="Trade amount (must be greater than 0)"
    )
    currency: str = Field(
        default="USD",
        description="Currency code (USD/EUR/GBP/JPY)"
    )

    @validator("currency")
    def validate_currency(cls, value):
        allowed = ["USD", "EUR", "GBP", "JPY"]
        value = value.upper()
        if value not in allowed:
            raise ValueError(f"Currency must be one of {allowed}")
        return value


# ============================================================
# TRADE UPDATE SCHEMA
# ============================================================

class TradeUpdate(BaseModel):
    status: str = Field(
        ...,
        description="New trade status (pending/approved/rejected)"
    )

    @validator("status")
    def validate_status(cls, value):
        allowed = ["pending", "approved", "rejected"]
        value = value.lower()
        if value not in allowed:
            raise ValueError(f"Status must be one of {allowed}")
        return value


# ============================================================
# TRADE RESPONSE SCHEMA
# ============================================================

class TradeResponse(BaseModel):
    id: str
    initiator_id: int
    counterparty_id: int
    amount: float
    currency: str
    status: str
    is_tampered: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
