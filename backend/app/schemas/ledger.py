from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any
from app.models.ledger import LedgerAction
from app.schemas.user import UserResponse


# Request schemas
class LedgerEntryCreate(BaseModel):
    document_id: int
    action: LedgerAction
    entry_metadata: Optional[Dict[str, Any]] = None


# Response schemas
class LedgerEntryResponse(BaseModel):
    id: int
    document_id: Optional[int]
    action: LedgerAction
    actor_id: Optional[int]
    entry_metadata: Optional[Dict[str, Any]]
    created_at: datetime
    previous_hash: Optional[str] = None
    entry_hash: Optional[str] = None
    actor: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True
