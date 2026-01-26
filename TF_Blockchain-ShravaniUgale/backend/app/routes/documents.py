from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.document import TradeDocument
from app.schemas.document import DocumentCreate, DocumentOut
from app.dependencies import get_current_user

router = APIRouter(prefix="/documents", tags=["Documents"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=DocumentOut)
def create_document(
    doc: DocumentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    new_doc = TradeDocument(
        title=doc.title,
        doc_type=doc.doc_type,
        owner_email=current_user.email,
        org_name=current_user.org_name
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc

@router.get("/", response_model=list[DocumentOut])
def list_documents(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role == "admin":
        return db.query(TradeDocument).all()
    else:
        return db.query(TradeDocument).filter(
            TradeDocument.org_name == current_user.org_name
        ).all()
from fastapi import HTTPException

@router.put("/{doc_id}/status")
def update_document_status(
    doc_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can update status")

    document = db.query(TradeDocument).filter(TradeDocument.id == doc_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    document.status = status
    db.commit()
    return {"message": "Status updated successfully"}
