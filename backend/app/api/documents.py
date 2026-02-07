from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.db.session import get_db
from app.schemas.document import DocumentResponse
from app.services.document_service import DocumentService
from app.api.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.document import DocumentType

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    doc_type: DocumentType = Form(...),
    doc_number: str = Form(...),
    issued_at: str = Form(...),  # Accept as string, parse in service
    current_user: User = Depends(require_roles([UserRole.BANK, UserRole.CORPORATE, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Upload a trade finance document"""
    return await DocumentService.upload_document(
        db, current_user, file, doc_type, doc_number, issued_at
    )


@router.get("", response_model=List[DocumentResponse])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List documents (scoped by user role)"""
    return DocumentService.list_documents(db, current_user)


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get document details"""
    return DocumentService.get_document_by_id(db, current_user, document_id)


@router.get("/{document_id}/verify")
def verify_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify document hash integrity"""
    return DocumentService.verify_document_hash(db, current_user, document_id)
