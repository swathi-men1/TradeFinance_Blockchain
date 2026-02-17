from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import TradeTransaction, TransactionStatus
from ..routes.auth_routes import get_current_user
from pydantic import BaseModel
from datetime import datetime
from ..utils import log_action

router = APIRouter(prefix="/transactions", tags=["Transactions"])

# -------------------------
# SCHEMA
# -------------------------


class CreateTransactionRequest(BaseModel):
    buyer_id: int
    seller_id: int
    amount: float
    currency: str


class UpdateTransactionStatusRequest(BaseModel):
    status: TransactionStatus


# -------------------------
# CREATE TRANSACTION
# -------------------------


@router.post("/")
def create_transaction(data: CreateTransactionRequest,
                       db: Session = Depends(get_db),
                       current_user=Depends(get_current_user)):

    new_tx = TradeTransaction(buyer_id=data.buyer_id,
                              seller_id=data.seller_id,
                              amount=data.amount,
                              currency=data.currency,
                              status=TransactionStatus.pending,
                              created_at=datetime.utcnow(),
                              updated_at=datetime.utcnow())

    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)

    log_action(db=db,
               user_id=current_user.id,
               action_type="CREATE_TRANSACTION",
               entity_type="TRANSACTION",
               entity_id=new_tx.id,
               description=f"Transaction {new_tx.id} created")

    return {"message": "Transaction created", "transaction_id": new_tx.id}


# -------------------------
# LIST TRANSACTIONS
# -------------------------


@router.get("/")
def list_transactions(db: Session = Depends(get_db),
                      current_user=Depends(get_current_user)):

    transactions = db.query(TradeTransaction).all()

    return [{
        "id": tx.id,
        "buyer_id": tx.buyer_id,
        "seller_id": tx.seller_id,
        "amount": float(tx.amount),
        "currency": tx.currency,
        "status": tx.status,
        "created_at": tx.created_at,
        "updated_at": tx.updated_at
    } for tx in transactions]


# -------------------------
# UPDATE STATUS
# -------------------------


@router.put("/{transaction_id}")
def update_transaction_status(transaction_id: int,
                              data: UpdateTransactionStatusRequest,
                              db: Session = Depends(get_db),
                              current_user=Depends(get_current_user)):

    tx = db.query(TradeTransaction).filter(
        TradeTransaction.id == transaction_id).first()

    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    tx.status = data.status
    tx.updated_at = datetime.utcnow()

    db.commit()

    log_action(
        db=db,
        user_id=current_user.id,
        action_type="UPDATE_TRANSACTION_STATUS",
        entity_type="TRANSACTION",
        entity_id=tx.id,
        description=f"Transaction {tx.id} status updated to {tx.status}")

    return {
        "message": "Transaction status updated",
        "transaction_id": tx.id,
        "new_status": tx.status
    }
