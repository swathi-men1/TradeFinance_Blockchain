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
# Request Schema
# --------------------------------------------------
class TradeCreate(BaseModel):
    seller: str
    document_id: int
    amount: float


# --------------------------------------------------
# Create Trade Endpoint
# --------------------------------------------------
@router.post(
    "/create",
    operation_id="create_trade",   # ✅ prevents duplicate OpenAPI warning
    status_code=status.HTTP_200_OK
)
def create_trade_endpoint(
    data: TradeCreate,
    user: dict = Depends(require_role("BUYER"))
):
    """
    Create a new trade between buyer and seller.
    Only BUYER role is allowed.
    """

    # Extract username from JWT payload
    username = user.get("sub")

    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )

    # Create trade
    trade = create_trade(
        data=data.model_dump(),
        buyer=username
    )

    # Recalculate risk for both parties
    calculate_user_risk(username)
    calculate_user_risk(data.seller)

    @router.get("/trades")
    def get_trades():
        return [
            {"id": 1, "seller": "ABC Corp", "amount": 50000},
            {"id": 2, "seller": "XYZ Ltd", "amount": 120000},
        ]

    return trade
