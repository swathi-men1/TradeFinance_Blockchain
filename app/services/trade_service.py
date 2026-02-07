from app.services.ledger_service import create_ledger_entry

trades_db = []

def create_trade(data: dict, buyer: str):
    trade_id = len(trades_db) + 1

    trade = {
        "trade_id": trade_id,
        "status": "CREATED",
        "buyer": buyer,
        "seller": data["seller"],
        "document_id": data["document_id"],
        "amount": data["amount"]
    }

    trades_db.append(trade)

    # Ledger entry for trade creation
    create_ledger_entry(
        document_id=data["document_id"],
        doc_hash=f"HASH_DOC_{data['document_id']}",
        action="TRADE_CREATED",
        user={"sub": buyer, "role": "BUYER"}
    )

    return trade
