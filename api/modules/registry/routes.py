# /* Author: Abdul Samad | */
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from sqlalchemy.orm import Session
from typing import List
from db.session import get_db
from db.models import Documents, UserProfiles, RoleEnum, DocTypeEnum, TradeFlows
from api.modules.auth.routes import get_current_user
from api.modules.registry import service
from schemas import DocumentResponse
from core.permissions import RoleChecker, get_doc_context
from utils.audit_logger import log_audit_event

router = APIRouter()

@router.get("", include_in_schema=False)
@router.get("/")
def list_documents(db: Session = Depends(get_db), current_user: UserProfiles = Depends(get_current_user)):
    import traceback
    try:
        """List all documents accessible to the current user based on role and organization."""
        user_role = current_user.role
        
        # Auditor and Admin see all documents (Admin for maintenance, Auditor for oversight)
        if user_role in [RoleEnum.auditor, RoleEnum.admin]:
            docs = db.query(Documents).all()
            return docs
        
        # Bank: Sees all documents involved in transactions (simplified for demo)
        if user_role == RoleEnum.bank:
            # Strictly speaking, they should only see ones they are party to, 
            # but in this demo we allow them to see all trade-related docs.
            return db.query(Documents).all()

        # Corporate: Sees documents they own OR where they are a counterparty in a trade
        # Strategy:
        # 1. Documents owned by the user
        owned_docs = db.query(Documents).filter(Documents.owner_id == current_user.id).all()
        
        # 2. Documents linked to trades where user is a counterparty (Buyer/Seller)
        # Step A: Find Trade IDs where user is involved
        participating_trades = db.query(TradeFlows.id).filter(
            (TradeFlows.buyer_id == current_user.id) | (TradeFlows.seller_id == current_user.id)
        ).all()
        # participating_trades is a list of tuples like [(1,), (2,)]
        trade_ids = [t[0] for t in participating_trades]
        
        # Step B: Find Documents linked to these Trades
        trade_docs = []
        if trade_ids:
            trade_docs = db.query(Documents).filter(Documents.trade_id.in_(trade_ids)).all()
        
        # 3. Combine and Deduplicate
        all_docs = {d.id: d for d in owned_docs + trade_docs}.values()
        
        return list(all_docs)
    except Exception as e:
        db.rollback()
        with open("detailed_error.log", "a") as f:
            f.write(f"CRASH IN LIST_DOCUMENTS: {str(e)}\n")
            traceback.print_exc(file=f)
        print(f"CRASH IN LIST_DOCUMENTS: {e}")
        return []


@router.post(
    "/upload", 
    response_model=DocumentResponse,
    summary="Upload Document (Digital Vault)",
    description="Uploads a trade artifact (Invoice, LoC) to the repository."
)
async def upload_document(
    doc_type: DocTypeEnum = Form(...),
    doc_number: str = Form(...),
    trade_id: int = Form(None), # Optional, but required for non-PO docs
    file: UploadFile = File(...),
    current_user: UserProfiles = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from services.workflow_service import WorkflowService
    
    # 0. Strict Enum Governance (Demo-Specific Hard Rule)
    if current_user.role == RoleEnum.corporate:
        if doc_type in [DocTypeEnum.LOC, DocTypeEnum.INSURANCE_CERT]:
            raise HTTPException(status_code=403, detail="Corporate users cannot upload Banking Instruments (LOC/Insurance).")
    
    if current_user.role == RoleEnum.bank:
        if doc_type in [DocTypeEnum.PO, DocTypeEnum.INVOICE, DocTypeEnum.BILL_OF_LADING]:
             raise HTTPException(status_code=403, detail="Bank users cannot upload Commercial Documents (PO/Invoice/BL).")

    # 1. Validate Workflow Rules
    WorkflowService.validate_upload_permission(db, current_user, doc_type, trade_id)

    # 2. Handle Trade Creation (PO Logic)
    target_trade_id = trade_id
    if doc_type == DocTypeEnum.PO and not trade_id:
        # Create new Trade Transaction
        new_trade = TradeFlows(
            buyer_id=current_user.id,
            seller_id=current_user.id, # Placeholder, implies "Pending Seller Assignment" or Self-Initiated
            amount=0, # Placeholder
            currency="USD",
            status="pending"
        )
        db.add(new_trade)
        db.commit()
        db.refresh(new_trade)
        target_trade_id = new_trade.id
        print(f"DEBUG: Created New Trade #{target_trade_id} for PO.")

    # 3. Save Document
    try:
        doc = await service.save_document(db, file, doc_type, doc_number, current_user, trade_id=target_trade_id)
        
        # 4. Post-Upload Actions (Update Status)
        if target_trade_id:
            trade = db.query(TradeFlows).filter(TradeFlows.id == target_trade_id).first()
            WorkflowService.post_upload_actions(db, trade, doc_type)
        
        # Audit Log
        log_audit_event(
            user_id=current_user.id,
            action="DOCUMENT_UPLOADED",
            target_type="DOCUMENT",
            target_id=doc.id,
            details={"doc_type": str(doc_type), "doc_number": doc_number, "trade_id": target_trade_id}
        )
        return doc
    except Exception as e:
        raise e

@router.get("/{doc_id}", response_model=DocumentResponse)
def get_document(doc=Depends(get_doc_context)):
    """Retrieves a specific document. Access is gated by get_doc_context dependency (Counterparty Rule)."""
    return doc

@router.post("/verify")
async def verify_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Trust Widget Endpoint: Re-calculates hash of uploaded file and compares against ledger.
    Publicly accessible (or at least no specific RBAC required for 'public widget' concept, 
    though here we might keep it open or require basic auth depending on requirements. 
    Assuming public or basic user access).
    """
    # 1. Calculate Hash
    import hashlib
    content = await file.read()
    file_hash = hashlib.sha256(content).hexdigest()
    
    # 2. Key Lookup
    # Search in Documents table
    doc = db.query(Documents).filter(Documents.hash == file_hash).first()
    
    if doc:
        return {
            "status": "VALID",
            "doc_id": doc.id,
            "doc_number": doc.doc_number,
            "hash": file_hash,
            "issued_at": doc.issued_at,
            "message": "Document is authentic and found in the ledger."
        }
    else:
        # 3. Response Logic
        return {
            "status": "TAMPERED",
            "hash": file_hash,
            "message": "Document hash not found. File may be tampered with or not yet registered."
        }

@router.post("/{doc_id}/verify-integrity")
def verify_document_integrity(
    doc=Depends(get_doc_context),
    db: Session = Depends(get_db), 
    current_user: UserProfiles = Depends(RoleChecker([RoleEnum.auditor, RoleEnum.admin, RoleEnum.bank]))
):
    """
    Manual Trigger for Oversight Roles to verify File Integrity (S3/Local vs DB).
    "Digital Watchdog" - Detects if the physical file has been tampered with.
    """
    from services.integrity_service import IntegrityService
    result = IntegrityService.verify_document(db, doc.id, current_user.id)
    
    # Audit Log
    log_audit_event(
        user_id=current_user.id,
        action="INTEGRITY_CHECK",
        target_type="DOCUMENT",
        target_id=doc.id,
        details={"status": result.get("status")}
    )
    
    return result

@router.post("/{doc_id}/amend", response_model=DocumentResponse)
async def amend_document(
    doc_id: int,
    file: UploadFile = File(...),
    current_user: UserProfiles = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Enforces Immutability: Creates a NEW document row and marks the OLD one as AMENDED in the ledger.
    """
    # 1. Verify existence and ownership of original
    original_doc = db.query(Documents).filter(Documents.id == doc_id).first()
    if not original_doc:
         raise HTTPException(status_code=404, detail="Original document not found")
    
    # RBAC: Only owner can amend
    if original_doc.owner_id != current_user.id:
         raise HTTPException(status_code=403, detail="Only the document owner can issue an amendment.")
    
    # 2. Upload the new version
    from api.modules.registry import service
    new_doc = await service.save_document(
        db, file, original_doc.doc_type, f"{original_doc.doc_number}-REV", current_user
    )
    
    # 3. Create AMENDED entry on the ORIGINAL document linking to the NEW one
    from services.ledger_service import LedgerService
    LedgerService.create_entry(
        db,
        original_doc.id,
        ActionEnum.AMENDED,
        current_user.id,
        metadata={"new_doc_id": new_doc.id, "reason": "Amendment issued by owner"}
    )
    
    log_audit_event(
        user_id=current_user.id,
        action="DOCUMENT_AMENDED",
        target_type="DOCUMENT",
        target_id=original_doc.id,
        details={"new_version_id": new_doc.id}
    )
    
    db.commit()
    return new_doc

@router.patch("/{doc_id}/status", response_model=DocumentResponse)
def update_document_status(
    doc_id: int,
    status: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: UserProfiles = Depends(RoleChecker([RoleEnum.bank]))
):
    """
    Updates the status of a document (Accepted/Rejected).
    Only Banks can perform this action.
    """
    doc = db.query(Documents).filter(Documents.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Validate status enum
    from db.models import DocStatusEnum
    try:
        new_status = DocStatusEnum(status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")

    doc.status = new_status
    
    # Audit Log
    log_audit_event(
        user_id=current_user.id,
        action="DOCUMENT_STATUS_UPDATE",
        target_type="DOCUMENT",
        target_id=doc.id,
        details={"old_status": str(doc.status), "new_status": str(new_status)}
    )
    
    db.commit()
    db.refresh(doc)
    return doc

@router.delete("/{doc_id}", status_code=204)
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: UserProfiles = Depends(RoleChecker([RoleEnum.admin, RoleEnum.bank]))
):
    """
    Deletes a document.
    Authorized for Admin (cleanup) and Bank (compliance).
    """
    doc = db.query(Documents).filter(Documents.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Audit Log before deletion
    log_audit_event(
        user_id=current_user.id,
        action="DOCUMENT_DELETED",
        target_type="DOCUMENT",
        target_id=doc.id,
        details={"doc_number": doc.doc_number, "reason": "Manual Deletion"}
    )

    db.delete(doc)
    db.commit()
    return None
