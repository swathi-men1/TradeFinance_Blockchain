from fastapi import APIRouter
from app.schemas import TradeCreate
from app.routes.ledger import add_ledger_entry

router = APIRouter()   # ✅ THIS LINE WAS MISSING OR WRONG

trades_db = []

@router.post("/")
def create_trade(trade: TradeCreate):
    trade_data = trade.dict()
    trade_data["status"] = "CREATED"
    trades_db.append(trade_data)

    add_ledger_entry(
        action="TRADE_CREATED",
        details=trade_data
    )

    return {
        "message": "Trade created successfully",
        "trade": trade_data
    }
