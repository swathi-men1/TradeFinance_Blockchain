from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.routes.auth import require_role
from app.services.trade_service import create_trade
from app.services.risk_service import calculate_user_risk

# --------------------------------------------------
# Router Configuration
# --------------------------------------------------

router = APIRouter(
    prefix="/trades",
    tags=["Trades"]
)

# --------------------------------------------------
# TEMP DATABASE (IN-MEMORY)
# --------------------------------------------------

trade_db = []

# --------------------------------------------------
# Request Schema
# --------------------------------------------------

class TradeCreate(BaseModel):
    seller: str
    document_id: int
    amount: float


# --------------------------------------------------
# CREATE TRADE
# --------------------------------------------------

@router.post("/create", status_code=status.HTTP_200_OK)
def create_trade_endpoint(
    data: TradeCreate,
    user: dict = Depends(require_role("BUYER"))
):
    """
    Only BUYER can create trade
    """

    username = user.get("sub")

    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )

    # Create trade using service
    trade = create_trade(
        data=data.model_dump(),
        buyer=username
    )

    # Save locally (for dashboard)
    trade_db.append(trade)

    # Update risk
    calculate_user_risk(username)
    calculate_user_risk(data.seller)

    return trade


# --------------------------------------------------
# GET ALL TRADES  ✅ (Dashboard needs this)
# --------------------------------------------------

@router.get("")
def get_trades():
    return trade_db