from pydantic import BaseModel
from typing import Optional

class LedgerEntry(BaseModel):
    document_id: Optional[int] = None
    trade_id: Optional[int] = None
    doc_hash: Optional[str] = None
    action: str
    username: str
    role: str
    related_user: Optional[str] = None
    timestamp: str
    previous_hash: Optional[str] = None
    current_hash: str


ledger_db = []
