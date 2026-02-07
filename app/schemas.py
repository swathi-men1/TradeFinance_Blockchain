from pydantic import BaseModel

class TradeCreate(BaseModel):
    trade_id: str
    buyer: str
    seller: str
    bank: str
    amount: float
    currency: str
