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


# ✅ CREATE TRADE
@router.post("/")
def create_trade(
    buyer_id: int,
    seller_id: int,
    amount: float,
    currency: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only BANK or ADMIN can create trade
    if current_user.role.upper() not in ["BANK", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Validate users exist
    buyer = db.query(User).filter(User.id == buyer_id).first()
    seller = db.query(User).filter(User.id == seller_id).first()

    if not buyer or not seller:
        raise HTTPException(status_code=404, detail="Buyer or Seller not found")

    trade = TradeTransaction(
        id=uuid.uuid4(),
        buyer_id=buyer_id,       # ✅ INTEGER
        seller_id=seller_id,     # ✅ INTEGER
        amount=amount,
        currency=currency,
        status="pending"
    )

    db.add(trade)
    db.flush()  # get trade.id

    ledger = LedgerEntry(
        entity_type="trade",
        entity_id=trade.id,
        previous_hash=None,
        current_hash="TRADE_CREATED",
        action="CREATE",
        actor_id=current_user.id
    )

    db.add(ledger)
    db.commit()
    db.refresh(trade)

    return {
    "trade_id": str(trade.id),
    "buyer_id": trade.buyer_id,
    "seller_id": trade.seller_id,
    "amount": trade.amount,
    "currency": trade.currency,
    "status": trade.status
}



# ✅ UPDATE STATUS
@router.patch("/{trade_id}/status")
def update_trade_status(
    trade_id: uuid.UUID,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

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
        current_hash=f"STATUS_{status.upper()}",
        action="STATUS_UPDATE",
        actor_id=current_user.id
    )

    db.add(ledger)
    db.commit()

    return {"message": "Trade status updated"}
