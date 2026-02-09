from fastapi import APIRouter

router = APIRouter()

@router.get("/entries")
def get_ledger_entries():
    return {"ledger": []}
