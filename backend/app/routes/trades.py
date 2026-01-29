import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.trade_transaction import TradeTransaction
from app.models.ledger import LedgerEntry

router = APIRouter(
    prefix="/trades",
    tags=["Trade Transactions"]
)

@router.post("/")
def create_trade(
    amount: float,
    currency: str,
    db: Session = Depends(get_db)
):
    # TEMP: replace with JWT later
    buyer_id = uuid.uuid4()
    seller_id = uuid.uuid4()

    trade = TradeTransaction(
        buyer_id=buyer_id,
        seller_id=seller_id,
        amount=amount,
        currency=currency
    )

    db.add(trade)
    db.commit()
    db.refresh(trade)

    # Ledger entry
    ledger = LedgerEntry(
        document_id=trade.id,
        document_hash="TRADE_CREATED",
        previous_hash=None
    )
    db.add(ledger)
    db.commit()

    return trade


@router.patch("/{trade_id}/status")
def update_trade_status(
    trade_id: uuid.UUID,
    status: str,
    db: Session = Depends(get_db)
):
    trade = db.query(TradeTransaction).get(trade_id)
    trade.status = status
    db.commit()

    # Ledger entry for lifecycle event
    ledger = LedgerEntry(
        document_id=trade.id,
        document_hash=f"STATUS_{status}",
        previous_hash=None
    )
    db.add(ledger)
    db.commit()

    return {"message": "Trade status updated"}
