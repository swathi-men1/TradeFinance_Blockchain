from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any
from app.models.ledger import LedgerAction


# Request schemas
class LedgerEntryCreate(BaseModel):
    document_id: int
    action: LedgerAction
    entry_metadata: Optional[Dict[str, Any]] = None


# Response schemas
class LedgerEntryResponse(BaseModel):
    id: int
    document_id: int
    action: LedgerAction
    actor_id: Optional[int]
    entry_metadata: Optional[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True
