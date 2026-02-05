import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.trade_transaction import TradeTransaction
from app.models.ledger import LedgerEntry
from app.models.user import User
from app.dependencies.auth import get_current_user

router = APIRouter(
    prefix="/trades",
    tags=["Trade Transactions"]
)


@router.post("/")
def create_trade(
    amount: float,
    currency: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    actor_id = current_user.id

    trade = TradeTransaction(
        buyer_id=uuid.uuid4(),
        seller_id=uuid.uuid4(),
        amount=amount,
        currency=currency
    )

    db.add(trade)
    db.flush()  # to get trade.id

    ledger = LedgerEntry(
        entity_type="trade",
        entity_id=trade.id,
        previous_hash=None,
        current_hash="TRADE_CREATED",
        action="CREATE",
        actor_id=actor_id
    )

    db.add(ledger)
    db.commit()
    db.refresh(trade)

    return trade


@router.patch("/{trade_id}/status")
def update_trade_status(
    trade_id: uuid.UUID,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    actor_id = current_user.id

    trade = db.query(TradeTransaction).filter(
        TradeTransaction.id == trade_id
    ).first()

    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    trade.status = status
    db.flush()

    ledger = LedgerEntry(
        entity_type="trade",
        entity_id=trade.id,
        previous_hash=None,
        current_hash=f"STATUS_{status}",
        action="STATUS_UPDATE",
        actor_id=actor_id
    )

    db.add(ledger)
    db.commit()

    return {"message": "Trade status updated"}
