from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from sqlalchemy.orm import Session
import uuid, os

from utils.auth_dependencies import get_db, get_current_user
from models.document import Document
from utils.hash_utils import generate_sha256
from ledger_entry import create_ledger_entry

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


from services.storage import storage_service
from services.risk_service import RiskService

# --------------------------------------------------
# UPLOAD DOCUMENT (BUYER / SELLER)
# --------------------------------------------------
@router.post("/upload")
def upload_doc(
    document_type: str = Form(...),
    transaction_id: int = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if user["role"] != "corporate":
        raise HTTPException(
            status_code=403,
            detail="Only corporate users can upload documents"
        )

    doc_id = str(uuid.uuid4())
    
    # Upload to "S3"
    try:
        s3_key = storage_service.upload_file(file)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

    # Calculate Hash (re-calculating from saved file to ensure integrity of stored object)
    file_path = storage_service.get_file_path(s3_key)
    file_hash = generate_sha256(file_path)

    # Calculate Risk Score using RiskService
    risk_score = RiskService.calculate_document_risk(document_type, user["id"], db)
    
    doc = Document(
        document_id=doc_id,
        document_type=document_type,
        transaction_id=transaction_id,
        uploaded_by=user["id"],
        s3_key=s3_key,
        sha256_hash=file_hash,
        status="PENDING",
        risk_score=risk_score
    )

    db.add(doc)
    db.commit()
    db.refresh(doc)

    create_ledger_entry(
        db=db,
        document_id=doc_id,
        transaction_id=transaction_id,
        action="UPLOAD",
        role=user["role"],
        performed_by=user["id"]
    )

    return {
        "message": "Document uploaded successfully",
        "document_id": doc_id,
        "risk_score": risk_score
    }

# --------------------------------------------------
# VERIFY DOCUMENT INTEGRITY (TAMPER CHECK)
# --------------------------------------------------
@router.get("/verify-integrity/{doc_id}")
def verify_document_integrity(
    doc_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.document_id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Re-calculate hash of the stored file
    try:
        file_path = storage_service.get_file_path(doc.s3_key)
        if not os.path.exists(file_path):
             return {"status": "MISSING", "message": "File not found on server"}
        
        current_hash = generate_sha256(file_path)
    except Exception as e:
        return {"status": "ERROR", "message": str(e)}

    is_valid = (current_hash == doc.sha256_hash)
    
    return {
        "status": "VALID" if is_valid else "TAMPERED",
        "stored_hash": doc.sha256_hash,
        "current_hash": current_hash,
        "risk_score": doc.risk_score
    }


# --------------------------------------------------
# ACTION ON DOCUMENT (BANK ONLY: APPROVE / REJECT)
# --------------------------------------------------
@router.post("/action/{doc_id}")
def action_doc(
    doc_id: str,
    action_type: str = Form(...), # "APPROVE" or "REJECT"
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if user["role"] not in ["admin", "auditor"]:
        raise HTTPException(
            status_code=403,
            detail="Only admins and auditors can perform document actions"
        )

    doc = db.query(Document).filter(
        Document.document_id == doc_id
    ).first()

    if not doc:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    if action_type == "APPROVE":
        doc.status = "APPROVED"
        # Reduce document risk score on approval
        doc.risk_score = max(0, doc.risk_score - 10)
        # Also improve user's risk profile
        RiskService.update_entity_risk(doc.uploaded_by, db, -2.0, f"Document {doc_id} approved")
    elif action_type == "REJECT":
        doc.status = "REJECTED"
        doc.risk_score = min(100, doc.risk_score + 30)
        # Penalize user's risk profile
        RiskService.update_entity_risk(doc.uploaded_by, db, 5.0, f"Document {doc_id} rejected")
    else:
        raise HTTPException(status_code=400, detail="Invalid action type")

    db.commit()

    create_ledger_entry(
        db=db,
        document_id=doc_id,
        action=action_type,
        role=user["role"],
        performed_by=user["id"]
    )

    return {
        "document_id": doc_id,
        "status": doc.status
    }


# --------------------------------------------------
# LIST ALL (FOR BANK)
# --------------------------------------------------
@router.get("/all")
def all_documents(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if user["role"] not in ["bank", "admin", "auditor"]:
        raise HTTPException(status_code=403, detail="Access denied")

    documents = db.query(Document).all()

    return [
        {
            "document_id": d.document_id,
            "document_type": d.document_type,
            "status": d.status,
            "uploaded_by": d.uploaded_by,
            "sha256_hash": d.sha256_hash,
            "risk_score": d.risk_score,
            "created_at": d.created_at.isoformat() if d.created_at else None
        }
        for d in documents
    ]

# --------------------------------------------------
# LIST DOCUMENTS (MY UPLOADS)
# --------------------------------------------------
@router.get("/my-documents")
def my_documents(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    documents = db.query(Document).filter(
        Document.uploaded_by == user["id"]
    ).all()

    return [
        {
            "document_id": d.document_id,
            "document_type": d.document_type,
            "status": d.status,
            "uploaded_by": d.uploaded_by,
            "sha256_hash": d.sha256_hash,
            "risk_score": d.risk_score,
            "created_at": d.created_at.isoformat() if d.created_at else None
        }
        for d in documents
    ]
# --------------------------------------------------
# VIEW DOCUMENT CONTENT
# --------------------------------------------------
from fastapi.responses import FileResponse

@router.get("/view/{doc_id}")
def view_document(
    doc_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    # Retrieve document metadata
    doc = db.query(Document).filter(Document.document_id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check permissions (Owner, Admin, or Auditor)
    # Bank users might also need access? Assuming "bank" role users are approvers so they need access.
    # The requirement said "Corporate or Bank users upload". 
    # Role check: corporate (owner), bank (all?), auditor (all?), admin (all?)
    is_owner = (doc.uploaded_by == user["id"])
    if user["role"] not in ["admin", "auditor", "bank"] and not is_owner:
         raise HTTPException(status_code=403, detail="Access denied")

    # Get file path from storage service
    file_path = storage_service.get_file_path(doc.s3_key)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found in storage")

    return FileResponse(file_path)
