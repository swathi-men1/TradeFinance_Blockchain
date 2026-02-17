from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Document, LedgerEntry, LedgerAction
from ..routes.auth_routes import get_current_user
from ..utils import generate_ledger_hash, log_action
from datetime import datetime
import os
import hashlib

router = APIRouter(prefix="/documents", tags=["Documents"])

# -------------------------
# CREATE DOCUMENT WITH FILE UPLOAD
# -------------------------


@router.post("/")
def create_document(doc_type: str = Form(...),
                    doc_number: str = Form(...),
                    issued_at: str = Form(...),
                    file: UploadFile = File(...),
                    db: Session = Depends(get_db),
                    current_user=Depends(get_current_user)):

    # 1️⃣ Ensure uploads directory exists
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    upload_dir = os.path.join(base_dir, "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    # 2️⃣ Save uploaded file
    file_path = os.path.join(upload_dir, file.filename)

    try:
        content = file.file.read()
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception:
        raise HTTPException(status_code=500, detail="File upload failed")

    # 3️⃣ Generate SHA-256 hash of file content
    file_hash = hashlib.sha256(content).hexdigest()

    # 4️⃣ Create Document record
    new_doc = Document(
        owner_id=current_user.id,
        doc_type=doc_type,
        doc_number=doc_number,
        file_url=file_path,
        hash=file_hash,
        issued_at=datetime.fromisoformat(issued_at),
    )

    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    # 5️⃣ Ledger chaining
    last_entry = (db.query(LedgerEntry).filter(
        LedgerEntry.document_id == new_doc.id).order_by(
            LedgerEntry.created_at.desc()).first())

    previous_hash = last_entry.current_hash if last_entry else "GENESIS"

    current_hash = generate_ledger_hash(document_id=new_doc.id,
                                        action="ISSUED",
                                        actor_id=current_user.id,
                                        metadata={"note": "Document uploaded"},
                                        previous_hash=previous_hash)

    ledger_entry = LedgerEntry(document_id=new_doc.id,
                               action=LedgerAction.ISSUED,
                               actor_id=current_user.id,
                               event_metadata={"note": "Document uploaded"},
                               previous_hash=previous_hash,
                               current_hash=current_hash)

    db.add(ledger_entry)
    db.commit()

    # 6️⃣ Audit log
    log_action(
        db=db,
        user_id=current_user.id,
        action_type="UPLOAD_DOCUMENT",
        entity_type="DOCUMENT",
        entity_id=new_doc.id,
        description=f"Document {doc_number} uploaded with object storage")

    return {
        "message": "Document uploaded successfully",
        "document_id": new_doc.id,
        "file_hash": file_hash
    }


# -------------------------
# LIST DOCUMENTS
# -------------------------


@router.get("/")
def list_documents(db: Session = Depends(get_db),
                   current_user=Depends(get_current_user)):

    documents = (db.query(Document).filter(
        Document.owner_id == current_user.id).order_by(
            Document.created_at.desc()).all())

    return [{
        "id": doc.id,
        "doc_type": doc.doc_type,
        "doc_number": doc.doc_number,
        "file_url": doc.file_url,
        "hash": doc.hash,
        "issued_at": doc.issued_at,
        "created_at": doc.created_at
    } for doc in documents]
