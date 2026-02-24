from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from utils.auth_dependencies import get_db, get_current_user
from models.ledger_entry import LedgerEntry

router = APIRouter(
    prefix="/ledger",
    tags=["Ledger"]
)


# --------------------------------------------------
# VIEW LEDGER (AUDITOR / ADMIN)
# --------------------------------------------------
from services.ledger_service import LedgerService

# --------------------------------------------------
# VIEW LEDGER (AUDITOR / ADMIN)
# --------------------------------------------------
@router.get("/")
def view_ledger(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if user["role"] not in ["admin", "auditor"]:
        raise HTTPException(
            status_code=403,
            detail="Only admins or auditors can view the ledger"
        )

    entries = (
        db.query(LedgerEntry)
        .order_by(LedgerEntry.id.desc())
        .all()
    )

    return [
        {
            "id": e.id,
            "document_id": e.document_id,
            "transaction_id": e.transaction_id,
            "action": e.action,
            "role": e.actor_role,
            "performed_by": e.performed_by,
            "timestamp": e.timestamp,
            "previous_hash": e.previous_hash,
            "entry_hash": e.entry_hash
        }
        for e in entries
    ]

# --------------------------------------------------
# VERIFY LEDGER INTEGRITY
# --------------------------------------------------
@router.get("/verify")
def verify_ledger(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if user["role"] not in ["admin", "auditor"]:
        raise HTTPException(
            status_code=403,
            detail="Only admins or auditors can verify the ledger"
        )
    
    return LedgerService.verify_integrity(db)
