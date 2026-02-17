from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import LedgerEntry
from ..routes.auth_routes import get_current_user
from ..utils import generate_ledger_hash

router = APIRouter(prefix="/ledger", tags=["Ledger"])


@router.get("/{document_id}")
def get_ledger_entries(document_id: int,
                       db: Session = Depends(get_db),
                       current_user=Depends(get_current_user)):
    entries = (db.query(LedgerEntry).filter(
        LedgerEntry.document_id == document_id).order_by(
            LedgerEntry.created_at.asc()).all())

    if not entries:
        raise HTTPException(status_code=404, detail="No ledger entries found")

    return [{
        "id": entry.id,
        "action": entry.action,
        "actor_id": entry.actor_id,
        "previous_hash": entry.previous_hash,
        "current_hash": entry.current_hash,
        "created_at": entry.created_at
    } for entry in entries]


@router.get("/verify/{document_id}")
def verify_ledger(document_id: int,
                  db: Session = Depends(get_db),
                  current_user=Depends(get_current_user)):
    entries = (db.query(LedgerEntry).filter(
        LedgerEntry.document_id == document_id).order_by(
            LedgerEntry.created_at.asc()).all())

    if not entries:
        raise HTTPException(status_code=404, detail="No ledger entries found")

    previous_hash = "GENESIS"

    for entry in entries:
        recalculated_hash = generate_ledger_hash(document_id=entry.document_id,
                                                 action=entry.action,
                                                 actor_id=entry.actor_id,
                                                 metadata=entry.event_metadata,
                                                 previous_hash=previous_hash)

        if entry.current_hash != recalculated_hash:
            return {
                "document_id": document_id,
                "integrity": False,
                "message": "Ledger integrity compromised"
            }

        previous_hash = entry.current_hash

    return {
        "document_id": document_id,
        "integrity": True,
        "message": "Ledger integrity verified"
    }
