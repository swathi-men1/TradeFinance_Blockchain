from pydantic import BaseModel, Field
from datetime import datetime
from app.models.document import DocumentType


# Request schemas
class DocumentCreate(BaseModel):
    doc_type: DocumentType
    doc_number: str = Field(..., max_length=100)
    issued_at: datetime


# Response schemas
class DocumentResponse(BaseModel):
    id: int
    owner_id: int
    doc_type: DocumentType
    doc_number: str
    file_url: str
    hash: str
    issued_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True
