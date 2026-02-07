from datetime import datetime
from pydantic import BaseModel

class LedgerEntry(BaseModel):
    ledger_id: str
    document_id: str
    document_hash: str
    action: str
    performed_by: str
    role: str
    timestamp: datetime
    previous_hash: str | None
