from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from utils.auth_dependencies import get_db, get_current_user
from models.transaction import Transaction
from models.user import User
from services.ledger_service import LedgerService

router = APIRouter(
    prefix="/transactions",
    tags=["Transactions"]
)

# --------------------------------------------------
# SCHEMAS
# --------------------------------------------------
class TransactionCreate(BaseModel):
    items: str # Description of goods
    amount: float
    currency: str = "USD"
    counterparty_email: str # Email of the other party (Buyer/Seller)

class TransactionUpdate(BaseModel):
    status: str # SHIPPED, RECEIVED, PAID, COMPLETED, DISPUTED

# --------------------------------------------------
# CREATE TRANSACTION
# --------------------------------------------------
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_transaction(
    txn_data: TransactionCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if user["role"] != "corporate":
        raise HTTPException(status_code=403, detail="Only corporate users can initiate transactions")

    # Find counterparty
    counterparty = db.query(User).filter(User.email == txn_data.counterparty_email).first()
    if not counterparty:
        raise HTTPException(status_code=404, detail="Counterparty not found")
    if counterparty.role != "corporate":
         raise HTTPException(status_code=400, detail="Counterparty must be a corporate user")

    # Determine Buyer/Seller (Simplification: Creator is Seller for now, or arbitrary)
    # Let's assume the Creator is the SELLER and they are billing the BUYER.
    seller_id = user["id"]
    buyer_id = counterparty.id
    
    # Create the transaction
    new_txn = Transaction(
        buyer_id=buyer_id,
        seller_id=seller_id,
        items=txn_data.items,
        amount=txn_data.amount,
        currency=txn_data.currency,
        status="ISSUED",
        created_at=datetime.utcnow()
    )
    
    db.add(new_txn)
    db.commit()
    db.refresh(new_txn)
    
    # Create Ledger Entry
    LedgerService.create_entry(
        db=db,
        action="ISSUED",
        role=user["role"],
        performed_by=user["id"],
        transaction_id=new_txn.id
    )
    
    return {
        "message": "Transaction created successfully",
        "transaction_id": new_txn.id,
        "status": new_txn.status
    }

# --------------------------------------------------
# LIST MY TRANSACTIONS
# --------------------------------------------------
@router.get("/my-transactions")
def my_transactions(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    # Get txns where I am buyer OR seller
    txns = db.query(Transaction).filter(
        (Transaction.buyer_id == user["id"]) | (Transaction.seller_id == user["id"])
    ).all()
    
    # Enrich with counterparty info (this is basic, ideally join)
    results = []
    for txn in txns:
        is_buyer = (txn.buyer_id == user["id"])
        counterparty_id = txn.seller_id if is_buyer else txn.buyer_id
        counterparty = db.query(User).filter(User.id == counterparty_id).first()
        
        results.append({
            "id": txn.id,
            "role": "BUYER" if is_buyer else "SELLER",
            "counterparty": counterparty.name if counterparty else "Unknown",
            "items": txn.items,
            "amount": txn.amount,
            "currency": txn.currency,
            "status": txn.status,
            "created_at": txn.created_at
        })
        
    return results

# --------------------------------------------------
# UPDATE STATUS
# --------------------------------------------------
@router.put("/{txn_id}/status")
def update_status(
    txn_id: int,
    status_data: TransactionUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    # Check participation
    if user["id"] not in [txn.buyer_id, txn.seller_id] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    # TODO: Add state transition validation (e.g. can't go PENDING -> PAID without SHIPPED)
    # For now, allow flexible updates for prototype.
    
    txn.status = status_data.status
    txn.updated_at = datetime.utcnow()
    db.commit()
    
    # Ledger
    LedgerService.create_entry(
        db=db,
        action=status_data.status,
        role=user["role"],
        performed_by=user["id"],
        transaction_id=txn.id
    )
    
    return {"message": "Status updated", "new_status": txn.status}
