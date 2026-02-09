from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.models.document import DocumentType


# Request schemas
class DocumentCreate(BaseModel):
    doc_type: DocumentType
    doc_number: str = Field(..., max_length=100)
    issued_at: datetime


class DocumentUpdate(BaseModel):
    doc_type: Optional[DocumentType] = None
    doc_number: Optional[str] = Field(None, max_length=100)
    issued_at: Optional[datetime] = None


from app.schemas.user import UserResponse

# Response schemas
class DocumentResponse(BaseModel):
    id: int
    owner_id: int
    owner: UserResponse
    doc_type: DocumentType
    doc_number: str
    file_url: str
    hash: str
    issued_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True
