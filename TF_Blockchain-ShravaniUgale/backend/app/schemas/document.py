from pydantic import BaseModel

class DocumentCreate(BaseModel):
    title: str
    doc_type: str

class DocumentOut(BaseModel):
    id: int
    title: str
    doc_type: str
    status: str
    org_name: str
    owner_email: str

    class Config:
        from_attributes = True
