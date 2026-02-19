# Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.ledger import LedgerEntryCreate, LedgerEntryResponse
from app.services.ledger_service import LedgerService
from app.api.deps import get_current_user, require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/ledger", tags=["Ledger"])


@router.post("/entries", response_model=LedgerEntryResponse, status_code=201)
def create_ledger_entry(
    entry_data: LedgerEntryCreate,
    current_user: User = Depends(require_roles([UserRole.BANK, UserRole.CORPORATE, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Create a new ledger entry"""
    return LedgerService.create_entry(
        db,
        entry_data.document_id,
        entry_data.action,
        current_user.id,
        entry_data.entry_metadata
    )


@router.get("/documents/{document_id}", response_model=List[LedgerEntryResponse])
def get_document_ledger(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get ledger timeline for a document"""
    return LedgerService.get_document_timeline(db, document_id, current_user)


@router.get("/activity", response_model=List[LedgerEntryResponse])
def get_recent_activity(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent ledger activity"""
    return LedgerService.get_recent_activity(db, current_user, limit)
