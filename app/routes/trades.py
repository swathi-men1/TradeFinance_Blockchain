from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.routes.auth import require_role
from app.services.trade_service import create_trade

router = APIRouter(prefix="/trades", tags=["Trades"])


# ✅ Request body schema (VERY IMPORTANT)
class TradeCreate(BaseModel):
    seller: str
    document_id: int
    amount: float


@router.post("/create")
@router.post("/create")
def create_trade_endpoint(data: dict, user=Depends(require_role("BUYER"))):
    ...

    username = user.get("sub")

    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")

    return create_trade(data.dict(), username)
