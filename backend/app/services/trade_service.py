from app.models.trade import Trade, trades_db
from app.services.ledger_service import create_ledger_entry


def create_trade(data: dict, buyer: str):
    trade_id = len(trades_db) + 1

    trade_obj = Trade(
        trade_id=trade_id,
        buyer=buyer,
        seller=data["seller"],
        document_id=data["document_id"],
        amount=data["amount"]
    )

    trades_db.append(trade_obj)

    create_ledger_entry(
        action="TRADE_CREATED",
        user={"sub": buyer, "role": "BUYER"},
        document_id=data["document_id"],
        trade_id=trade_id,
        related_user=data["seller"],
    )

    return trade_obj.to_dict()
