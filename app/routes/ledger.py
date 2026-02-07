from fastapi import APIRouter
from app.services.ledger_service import ledger_db

router = APIRouter(prefix="/ledger", tags=["Ledger"])

@router.get("/{document_id}")
def get_ledger(document_id: int):
    return [entry for entry in ledger_db if entry["document_id"] == document_id]
