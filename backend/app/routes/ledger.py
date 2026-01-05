from fastapi import APIRouter
from datetime import datetime

router = APIRouter()   # ✅ REQUIRED

ledger_entries = []

def add_ledger_entry(action: str, details: dict):
    ledger_entries.append({
        "action": action,
        "details": details,
        "timestamp": datetime.utcnow()
    })

@router.get("/")
def view_ledger():
    return ledger_entries
