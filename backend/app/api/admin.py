from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.ledger import IntegrityReport, LedgerAction
from app.schemas.user import UserResponse, UserAdminCreate, UserUpdate
from app.api.deps import get_current_user
from app.services.integrity_service import IntegrityService
from app.services.ledger_service import LedgerService
from app.core.security import hash_password
from app.utils.user_utils import generate_user_code

router = APIRouter()

@router.get("/integrity-report", response_model=Dict[str, Any])
def get_integrity_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the latest integrity verification report.
    Only accessible by Admins.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access integrity reports"
        )
    
    # We can either return the stored reports or trigger a fresh run?
    # Requirement says "Integrity Report Storage" is used.
    # The scheduler runs periodically and stores reports.
    # But reports are per document.
    # The response format requested: { total, valid, failed, failure_details }
    
    # Option 1: Aggregate from latest IntegrityReport for each document
    # Option 2: Run fresh verification (might be slow if many docs)
    # Given requirements "Persist verification results", let's use the DB.
    
    # Fetch latest report for each document
    # This requires a slightly complex query (latest by group).
    # OR helper function in service.
    
    # For simplicity and real-time accuracy (if dataset is small), running verify_all_documents() is easiest
    # and ensures the report is up to date immediately when the admin asks.
    # BUT "Integrity Report Storage" implies we should use stored data.
    
    # If we use stored data, we need to handle "Stale" reports.
    # Let's try to fetch latest reports from DB.
    
    # For now, adhering to the "Admin API Endpoint" description in prompt:
    # "Run verify_all_documents()... Store results" in Scheduler.
    # "GET /admin/integrity-report" -> "total_documents, valid_documents..."
    
    # I'll implement a hybrid: Trigger a check if requested, OR just query.
    # Let's query recent reports.
    
    # Actually, verify_all_documents returns exactly the structure we need.
    # Let's just call it. It stores reports as side effect.
    return IntegrityService.verify_all_documents(db)


@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all users (Admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(User).all()


@router.post("/users", response_model=UserResponse)
def create_user(
    user_in: UserAdminCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new user (Admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate unique user code
    user_code = generate_user_code(user_in.name, db)
        
    user = User(
        user_code=user_code,
        name=user_in.name,
        email=user_in.email,
        password=hash_password(user_in.password),
        role=user_in.role,
        org_name=user_in.org_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user details including role (Admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_in.name: user.name = user_in.name
    if user_in.email: user.email = user_in.email
    if user_in.role: user.role = user_in.role
    if user_in.org_name: user.org_name = user_in.org_name
    if user_in.password: user.password = hash_password(user_in.password)
    
    db.commit()
    db.refresh(user)
    return user


@router.get("/users/pending", response_model=List[UserResponse])
def list_pending_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all pending user approvals (Admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(User).filter(User.is_active == False).all()


@router.post("/users/{user_id}/approve", response_model=UserResponse)
def approve_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approve a user registration (Admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_active:
        raise HTTPException(status_code=400, detail="User is already approved")
    
    user.is_active = True
    db.commit()
    db.refresh(user)
    
    # Create ledger entry for user approval
    LedgerService.create_entry(
        db=db,
        document_id=None,
        action=LedgerAction.USER_APPROVED,
        actor_id=current_user.id,
        entry_metadata={
            "approved_user_id": user.id,
            "approved_user_email": user.email,
            "approved_user_name": user.name,
            "approved_user_role": user.role.value,
            "approved_by": current_user.email
        }
    )
    
    return user


@router.post("/users/{user_id}/reject")
def reject_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Reject a user registration (Admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_active:
        raise HTTPException(status_code=400, detail="Cannot reject an approved user")
    
    # Create ledger entry for user rejection BEFORE deletion
    LedgerService.create_entry(
        db=db,
        document_id=None,
        action=LedgerAction.USER_REJECTED,
        actor_id=current_user.id,
        entry_metadata={
            "rejected_user_id": user.id,
            "rejected_user_email": user.email,
            "rejected_user_name": user.name,
            "rejected_user_role": user.role.value,
            "rejected_by": current_user.email
        }
    )
    
    # Delete the user entirely
    db.delete(user)
    db.commit()
    return {"message": "User registration rejected and deleted successfully"}


@router.get("/ledger/all", response_model=List[Dict[str, Any]])
def get_all_ledger_entries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all ledger entries (Admin/Auditor only)"""
    if current_user.role not in [UserRole.ADMIN, UserRole.AUDITOR]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    from app.models.ledger import LedgerEntry
    entries = db.query(LedgerEntry).order_by(LedgerEntry.created_at.desc()).all()
    
    result = []
    for entry in entries:
        result.append({
            "id": entry.id,
            "action": entry.action.value,
            "actor_id": entry.actor_id,
            "actor_name": entry.actor.name if entry.actor else "System",
            "actor_role": entry.actor.role.value if entry.actor else "System",
            "document_id": entry.document_id,
            "entry_metadata": entry.entry_metadata,
            "previous_hash": entry.previous_hash,
            "entry_hash": entry.entry_hash,
            "created_at": entry.created_at.isoformat()
        })
    
    return result


@router.get("/ledger/document/{document_id}", response_model=List[Dict[str, Any]])
def get_document_ledger(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get ledger entries for a specific document (Admin/Auditor only)"""
    if current_user.role not in [UserRole.ADMIN, UserRole.AUDITOR]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    from app.services.ledger_service import LedgerService
    entries = LedgerService.get_document_timeline(db, document_id)
    
    result = []
    for entry in entries:
        result.append({
            "id": entry.id,
            "action": entry.action.value,
            "actor_id": entry.actor_id,
            "actor_name": entry.actor.name if entry.actor else "System",
            "actor_role": entry.actor.role.value if entry.actor else "System",
            "document_id": entry.document_id,
            "entry_metadata": entry.entry_metadata,
            "previous_hash": entry.previous_hash,
            "entry_hash": entry.entry_hash,
            "created_at": entry.created_at.isoformat()
        })
    
    return result


@router.get("/ledger/user/{user_id}", response_model=List[Dict[str, Any]])
def get_user_ledger(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get ledger entries for a specific user (Admin/Auditor only)"""
    if current_user.role not in [UserRole.ADMIN, UserRole.AUDITOR]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    from app.models.ledger import LedgerEntry
    entries = db.query(LedgerEntry).filter(
        LedgerEntry.actor_id == user_id
    ).order_by(LedgerEntry.created_at.desc()).all()
    
    result = []
    for entry in entries:
        result.append({
            "id": entry.id,
            "action": entry.action.value,
            "actor_id": entry.actor_id,
            "actor_name": entry.actor.name if entry.actor else "System",
            "actor_role": entry.actor.role.value if entry.actor else "System",
            "document_id": entry.document_id,
            "entry_metadata": entry.entry_metadata,
            "previous_hash": entry.previous_hash,
            "entry_hash": entry.entry_hash,
            "created_at": entry.created_at.isoformat()
        })
    
    return result


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a user (Admin only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    # Delete related records in proper order to avoid foreign key constraints
    
    # Delete risk scores
    from app.models.risk import RiskScore
    db.query(RiskScore).filter(RiskScore.user_id == user_id).delete()
    
    # Delete documents owned by user
    from app.models.document import Document
    documents = db.query(Document).filter(Document.owner_id == user_id).all()
    for doc in documents:
        # Delete ledger entries for this document
        from app.models.ledger import LedgerEntry
        db.query(LedgerEntry).filter(LedgerEntry.document_id == doc.id).delete()
    
    db.query(Document).filter(Document.owner_id == user_id).delete()
    
    # Delete ledger entries where user is the actor
    from app.models.ledger import LedgerEntry
    db.query(LedgerEntry).filter(LedgerEntry.actor_id == user_id).delete()
    
    # Delete audit logs where user is the admin
    from app.models.audit import AuditLog
    db.query(AuditLog).filter(AuditLog.admin_id == user_id).delete()
    
    # Delete trades where user is buyer or seller
    from app.models.trade import TradeTransaction
    db.query(TradeTransaction).filter(
        (TradeTransaction.buyer_id == user_id) | (TradeTransaction.seller_id == user_id)
    ).delete()
    
    # Finally delete the user
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}
