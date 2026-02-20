from fastapi import APIRouter, Depends, Query, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import os

from app.db.session import get_db
from app.api.deps import require_roles
from app.models.user import UserRole
from app.services.bank_service import BankService

router = APIRouter(prefix="/bank", tags=["Bank"])

def remove_file(path: str):
    """Clean up temporary file after response is sent"""
    try:
        os.unlink(path)
    except Exception:
        pass

@router.get("/trades")
def get_trades(
    skip: int = Query(0, ge=0),
    limit: int = 100,
    current_user = Depends(require_roles([UserRole.BANK])),
    db: Session = Depends(get_db)
):
    return BankService.get_all_trades(db, skip, limit)

@router.put("/trades/{trade_id}/status")
def update_trade_status(
    trade_id: int,
    status: str = Query(..., regex="^(pending|in_progress|completed|paid|disputed)$"),
    current_user = Depends(require_roles([UserRole.BANK])),
    db: Session = Depends(get_db)
):
    return BankService.update_trade_status(db, trade_id, status, current_user.id)

@router.get("/documents")
def get_documents(
    skip: int = Query(0, ge=0),
    limit: int = 100,
    current_user = Depends(require_roles([UserRole.BANK])),
    db: Session = Depends(get_db)
):
    return BankService.get_documents(db, skip, limit)

@router.post("/documents/upload")
def upload_document(
    doc_type: str = Form(...),
    doc_number: str = Form(...),
    trade_id: int = Form(None),
    file: UploadFile = File(...),
    current_user = Depends(require_roles([UserRole.BANK])),
    db: Session = Depends(get_db)
):
    """
    Upload a document securely.
    - Reads file as bytes.
    - Generates SHA-256 hash.
    - Stores hash in DB for integrity verification.
    """
    return BankService.upload_document(db, file, doc_type, doc_number, trade_id, current_user.id)

@router.get("/documents/{document_id}/verify")
def verify_document(
    document_id: int,
    current_user = Depends(require_roles([UserRole.BANK])),
    db: Session = Depends(get_db)
):
    """
    Verify document integrity.
    - Re-reads stored file.
    - Generates fresh SHA-256 hash.
    - Compares with stored DB hash.
    - Logs 'VERIFIED' action to Ledger.
    Returns: {"verified": true/false}
    """
    return BankService.verify_document(db, document_id, current_user.id)

@router.get("/documents/{document_id}/view")
def view_document(
    document_id: int,
    background_tasks: BackgroundTasks,
    current_user = Depends(require_roles([UserRole.BANK])),
    db: Session = Depends(get_db)
):
    """
    View document content.
    - Serves the file using FileResponse.
    - CRITICAL: Logs 'VIEWED' action to Ledger for every access.
    """
    file_path = BankService.view_document(db, document_id, current_user.id)
    
    # Schedule cleanup of temp file
    background_tasks.add_task(remove_file, file_path)
    
    return FileResponse(file_path)

@router.get("/risk-monitor")
def get_risk_monitor(
    current_user = Depends(require_roles([UserRole.BANK])),
    db: Session = Depends(get_db)
):
    scores = BankService.get_risk_monitor(db)
    return [
        {
            "id": s.id,
            "user_id": s.user_id,
            "user_name": s.user.name if s.user else f"User #{s.user_id}",
            "org_name": s.user.org_name if s.user else "—",
            "score": float(s.score),
            "category": s.category,
            "rationale": s.rationale,
            "last_updated": s.last_updated.isoformat() if s.last_updated else None,
        }
        for s in scores
    ]


@router.get("/ledger")
def get_ledger(
    skip: int = Query(0, ge=0),
    limit: int = 100,
    current_user = Depends(require_roles([UserRole.BANK])),
    db: Session = Depends(get_db)
):
    return BankService.get_ledger(db, skip, limit)
