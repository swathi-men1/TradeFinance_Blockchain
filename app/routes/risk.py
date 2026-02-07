from fastapi import APIRouter
from app.services.trade_service import trades_db

router = APIRouter(prefix="/risk", tags=["Risk"])

@router.get("/{trade_id}")
def calculate_risk(trade_id: int):
    trade = next((t for t in trades_db if t["trade_id"] == trade_id), None)

    if not trade:
        return {"error": "Trade not found"}

    risk_score = "LOW" if trade["amount"] < 100000 else "HIGH"

    return {
        "trade_id": trade_id,
        "amount": trade["amount"],
        "risk_score": risk_score
    }
