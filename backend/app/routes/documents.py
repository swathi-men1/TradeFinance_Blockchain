import hashlib
import uuid

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.document import Document

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload")
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # -------------------- AUTH / ORG CHECK --------------------
    org_id = current_user.org_id
    if not org_id:
        raise HTTPException(
            status_code=400,
            detail="User is not linked to any organization"
        )

    # -------------------- READ FILE --------------------
    file_bytes = file.file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file")

    # -------------------- METADATA --------------------
    original_filename = file.filename
    mime_type = file.content_type or "application/octet-stream"
    file_size = len(file_bytes)

    # -------------------- HASH --------------------
    sha256_hash = hashlib.sha256(file_bytes).hexdigest()

    # -------------------- STORAGE KEY (MinIO/S3 placeholder) --------------------
    s3_key = f"org_{org_id}/{uuid.uuid4()}_{original_filename}"

    # -------------------- DOCUMENT TYPE (simple logic) --------------------
    document_type = "INVOICE" if "invoice" in original_filename.lower() else "OTHER"

    # -------------------- DB INSERT (MATCHES MODEL EXACTLY) --------------------
    document = Document(
        org_id=org_id,
        uploaded_by=current_user.id,
        document_type=document_type,
        original_filename=original_filename,
        mime_type=mime_type,
        file_size=file_size,
        s3_key=s3_key,
        sha256_hash=sha256_hash,
        status="UPLOADED"
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return {
        "message": "Document uploaded successfully",
        "document_id": str(document.id),
        "original_filename": original_filename,
        "document_type": document_type,
        "mime_type": mime_type,
        "file_size": file_size,
        "status": document.status
    }
