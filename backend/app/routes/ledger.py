import uuid
import hashlib
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ledger import LedgerEntry
from app.utils.rbac import require_roles

router = APIRouter(
    prefix="/ledger",
    tags=["Ledger"]
)

# ============================================================
# HELPER: SERIALIZER
# ============================================================
def serialize_ledger(entry: LedgerEntry):
    return {
        "id": str(entry.id),
        "entity_type": entry.entity_type,
        "entity_id": str(entry.entity_id),
        "previous_hash": entry.previous_hash,
        "current_hash": entry.current_hash,
        "action": entry.action,
        "actor_id": entry.actor_id,
        "created_at": entry.created_at
    }


# ============================================================
# LIST LEDGER ENTRIES (PAGINATED)
# Accessible by BANK / ADMIN / AUDITOR
# ============================================================
@router.get("/", dependencies=[Depends(require_roles(["bank", "admin", "auditor"]))])
def list_ledger_entries(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200)
):
    entries = (
        db.query(LedgerEntry)
        .order_by(LedgerEntry.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    total = db.query(LedgerEntry).count()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "entries": [serialize_ledger(e) for e in entries]
    }


# ============================================================
# GET SINGLE LEDGER ENTRY
# ============================================================
@router.get("/{entry_id}", dependencies=[Depends(require_roles(["bank", "admin", "auditor"]))])
def get_ledger_entry(
    entry_id: str,
    db: Session = Depends(get_db)
):
    try:
        entry_uuid = uuid.UUID(entry_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ledger ID format")

    entry = db.query(LedgerEntry).filter(
        LedgerEntry.id == entry_uuid
    ).first()

    if not entry:
        raise HTTPException(status_code=404, detail="Ledger entry not found")

    return serialize_ledger(entry)


# ============================================================
# VERIFY FULL LEDGER CHAIN INTEGRITY
# ============================================================
@router.get("/verify/chain", dependencies=[Depends(require_roles(["bank", "admin", "auditor"]))])
def verify_ledger_chain(
    db: Session = Depends(get_db)
):
    entries = (
        db.query(LedgerEntry)
        .order_by(LedgerEntry.created_at.asc())
        .all()
    )

    if not entries:
        return {
            "status": "empty",
            "message": "Ledger has no entries"
        }

    previous_hash = None

    for entry in entries:

        # 1️⃣ Check hash chaining
        if entry.previous_hash != previous_hash:
            return {
                "status": "corrupted",
                "corrupted_entry": str(entry.id),
                "reason": "Previous hash mismatch"
            }

        # 2️⃣ Recalculate hash properly
        recalculated_hash = hashlib.sha256(
            f"{entry.entity_type}"
            f"{entry.entity_id}"
            f"{entry.action}"
            f"{entry.actor_id}"
            f"{entry.previous_hash}".encode()
        ).hexdigest()

        # 3️⃣ Compare hashes
        if recalculated_hash != entry.current_hash:
            return {
                "status": "corrupted",
                "corrupted_entry": str(entry.id),
                "reason": "Current hash mismatch"
            }

        previous_hash = entry.current_hash

    return {
        "status": "valid",
        "message": "Ledger chain integrity verified successfully",
        "total_entries": len(entries)
    }
