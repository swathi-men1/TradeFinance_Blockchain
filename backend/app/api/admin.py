from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.ledger import IntegrityReport
from app.schemas.user import UserResponse, UserAdminCreate, UserUpdate
from app.api.deps import get_current_user
from app.services.integrity_service import IntegrityService
from app.core.security import hash_password

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
        
    user = User(
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
        
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}
