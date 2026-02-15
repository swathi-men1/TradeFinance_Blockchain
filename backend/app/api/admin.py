from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from typing import List, Optional, Literal
from datetime import datetime, timedelta
from io import StringIO
import csv

from app.db.session import get_db
from app.api.deps import get_current_user, require_roles
from app.core.security import hash_password as get_password_hash
from app.utils.user_utils import generate_user_code

# Models
from app.models.user import User, UserRole
from app.models.organization import Organization, OrganizationStatus
from app.models.audit import AuditLog
from app.models.document import Document
from app.models.trade import TradeTransaction
from app.models.risk import RiskScore
from app.models.compliance_alert import ComplianceAlert, AlertStatus, Severity, AlertType

# Schemas
from app.schemas.admin import (
    OrgCreate, OrgUpdate, OrgResponse,
    AdminUserCreate, AdminUserUpdateRole, SystemAnalytics,
    AuditLogResponse, AuditLogFilter
)
from app.schemas.user import UserResponse

router = APIRouter(tags=["Admin"])


# -----------------------------------------------------------------------------
# MODULE 1: Organization Management
# -----------------------------------------------------------------------------

@router.post("/org/create", response_model=OrgResponse)
def create_organization(
    org: OrgCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Create a new organization"""
    existing = db.query(Organization).filter(Organization.org_name == org.org_name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Organization already exists")
    
    new_org = Organization(org_name=org.org_name, status=org.status)
    db.add(new_org)
    db.commit()
    db.refresh(new_org)
    
    # Audit Log
    AuditLog.log_action(db, current_user.id, "CREATE_ORG", "Organization", new_org.id)
    return new_org

@router.get("/org/list", response_model=List[OrgResponse])
def list_organizations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[OrganizationStatus] = Query(None, description="Filter by status"),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    List all organizations with optional filtering.
    
    - Can filter by status (ACTIVE, SUSPENDED, PENDING)
    - Returns organization details with member counts
    """
    query = db.query(Organization)
    
    if status:
        query = query.filter(Organization.status == status)
    
    orgs = query.offset(skip).limit(limit).all()
    return orgs

@router.put("/org/{org_id}/update", response_model=OrgResponse)
def update_organization(
    org_id: int,
    updates: OrgUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Update organization details.
    
    - Can update status (ACTIVE, SUSPENDED, PENDING)
    - Cannot delete organizations with active users
    """
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Prevent deleting/suspending orgs with active users
    if updates.status == OrganizationStatus.SUSPENDED:
        active_users = db.query(User).filter(
            User.org_name == org.org_name,
            User.is_active == True
        ).count()
        if active_users > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot suspend organization with {active_users} active users"
            )
    
    if updates.status:
        org.status = updates.status
    
    db.commit()
    db.refresh(org)
    
    # Audit Log
    AuditLog.log_action(db, current_user.id, "UPDATE_ORG", "Organization", org.id)
    
    return org


# -----------------------------------------------------------------------------
# MODULE 2: User Management
# -----------------------------------------------------------------------------

@router.get("/users/list", response_model=List[UserResponse])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    org_name: Optional[str] = Query(None, description="Filter by organization"),
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    List all users with optional filtering.
    
    - Filter by organization, role, or active status
    - Returns user details (excluding password)
    """
    query = db.query(User)
    
    if org_name:
        query = query.filter(User.org_name == org_name)
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    users = query.offset(skip).limit(limit).all()
    return users

@router.post("/users/create", response_model=UserResponse)
def create_user(
    user_in: AdminUserCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Create a new user (Admin only).
    
    - **Email**: Must be unique
    - **Password**: Will be encrypted
    - **Role**: Must be bank, corporate, auditor, or admin
    - **Organization**: Must exist in the system
    - **is_active**: Account status
    """
    # Check if email already exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400, 
            detail="The user with this email already exists in the system."
        )
    
    # Validate Org exists
    org = db.query(Organization).filter(Organization.org_name == user_in.org_name).first()
    if not org:
        raise HTTPException(
            status_code=400, 
            detail=f"Organization '{user_in.org_name}' does not exist. Please create it first."
        )
    
    # Validate role is valid
    if user_in.role not in [UserRole.BANK, UserRole.CORPORATE, UserRole.AUDITOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Must be bank, corporate, auditor, or admin."
        )
    
    # Generate user code
    user_code = generate_user_code(user_in.org_name, db)
    
    user = User(
        email=user_in.email,
        name=user_in.name,
        password=get_password_hash(user_in.password),
        role=user_in.role,
        org_name=user_in.org_name,
        is_active=user_in.is_active,
        user_code=user_code
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Audit Log
    AuditLog.log_action(db, current_user.id, "CREATE_USER", "User", user.id)
    
    return user

@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: dict,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Update user details (name, email, org_name, role, password).
    
    - Admin only
    - Can update any user field
    - Password is optional (if provided, will be updated)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields if provided
    if "name" in user_update:
        user.name = user_update["name"]
    if "email" in user_update:
        # Check if email already exists for another user
        existing_user = db.query(User).filter(
            User.email == user_update["email"],
            User.id != user_id
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already exists")
        user.email = user_update["email"]
    if "org_name" in user_update:
        user.org_name = user_update["org_name"]
    if "role" in user_update:
        user.role = user_update["role"]
    if "password" in user_update and user_update["password"]:
        user.password = get_password_hash(user_update["password"])
    
    db.commit()
    db.refresh(user)
    
    # Audit Log
    AuditLog.log_action(db, current_user.id, "UPDATE_USER", "User", user.id)
    
    return user


@router.put("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    role_update: AdminUserUpdateRole,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Update user role.
    
    - Cannot change own role (prevents locking yourself out)
    - Role must be valid ENUM value
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot change your own role"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate role
    if role_update.role not in [UserRole.BANK, UserRole.CORPORATE, UserRole.AUDITOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Must be bank, corporate, auditor, or admin."
        )
    
    old_role = user.role
    user.role = role_update.role
    db.commit()
    db.refresh(user)
    
    # Audit Log
    AuditLog.log_action(
        db, current_user.id, "UPDATE_ROLE", "User", user.id
    )
    
    return user

@router.put("/users/{user_id}/activate", response_model=UserResponse)
def activate_user(
    user_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Activate user account"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = True
    db.commit()
    db.refresh(user)
    
    # Audit Log
    AuditLog.log_action(db, current_user.id, "ACTIVATE_USER", "User", user.id)
    return user

@router.put("/users/{user_id}/deactivate", response_model=UserResponse)
def deactivate_user(
    user_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Deactivate user account.
    
    - Cannot deactivate yourself
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot deactivate your own account"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = False
    db.commit()
    db.refresh(user)
    
    # Audit Log
    AuditLog.log_action(db, current_user.id, "DEACTIVATE_USER", "User", user.id)
    
    return user
    
@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Delete a user permanently.
    
    - Cannot delete yourself
    - Removes user from database
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete your own account"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check if user has related trades that might block deletion
    # If using CASCADE in models, this might not be needed, but explicit check is safer
    # For now, we'll try to delete and let SQLAlchemy handle integrity errors if any
    try:
        # Audit Log BEFORE deletion (since user will be gone)
        AuditLog.log_action(db, current_user.id, "DELETE_USER", "User", user.id)
        
        db.delete(user)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete user. They might be involved in active trades or other records. Error: {str(e)}"
        )

@router.get("/users/{user_id}/activity")
def get_user_activity(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Get activity logs for a specific user.
    
    - Returns ledger entries where user is the actor
    - Sorted by timestamp descending
    """
    from app.models.ledger import LedgerEntry
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    entries = db.query(LedgerEntry).filter(
        LedgerEntry.actor_id == user_id
    ).order_by(desc(LedgerEntry.created_at)).offset(skip).limit(limit).all()
    
    return {
        "user_id": user_id,
        "user_name": user.name,
        "total_entries": db.query(LedgerEntry).filter(LedgerEntry.actor_id == user_id).count(),
        "entries": [
            {
                "id": e.id,
                "action": e.action.value,
                "document_id": e.document_id,
                "timestamp": e.created_at,
                "metadata": e.entry_metadata
            }
            for e in entries
        ]
    }

# -----------------------------------------------------------------------------
# MODULE 3: Role & Permission Control
# -----------------------------------------------------------------------------

@router.get("/permissions/matrix")
def get_permission_matrix(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Get the permission matrix showing what each role can do.
    
    Returns a matrix of role capabilities.
    """
    roles = [UserRole.BANK, UserRole.CORPORATE, UserRole.AUDITOR, UserRole.ADMIN]
    
    matrix = {
        "roles": {},
        "description": {
            "documents": "Document management",
            "trades": "Trade transaction management",
            "ledger": "Ledger access",
            "users": "User management",
            "orgs": "Organization management",
            "audit": "Audit log access",
            "risk": "Risk score access",
            "admin": "System administration"
        }
    }
    
    for role in roles:
        if role == UserRole.BANK:
            matrix["roles"][role.value] = {
                "documents": "Create, Read, Update (own)",
                "trades": "Create, Read, Update (as participant)",
                "ledger": "Read (own activity)",
                "users": "Read (own profile)",
                "orgs": "Read (own organization)",
                "audit": "None",
                "risk": "Read (own score)",
                "admin": "None"
            }
        elif role == UserRole.CORPORATE:
            matrix["roles"][role.value] = {
                "documents": "Create, Read, Update (own)",
                "trades": "Create, Read, Update (as participant)",
                "ledger": "Read (own activity)",
                "users": "Read (own profile)",
                "orgs": "Read (own organization)",
                "audit": "None",
                "risk": "Read (own score)",
                "admin": "None"
            }
        elif role == UserRole.AUDITOR:
            matrix["roles"][role.value] = {
                "documents": "Read (all), Verify integrity",
                "trades": "Read (all)",
                "ledger": "Read (all), Validate lifecycle",
                "users": "Read (all)",
                "orgs": "Read (all)",
                "audit": "Read (all)",
                "risk": "Read (all)",
                "admin": "None"
            }
        elif role == UserRole.ADMIN:
            matrix["roles"][role.value] = {
                "documents": "Read (all)",
                "trades": "Read (all), Manage disputes",
                "ledger": "Read (all)",
                "users": "Create, Read, Update, Activate/Deactivate",
                "orgs": "Create, Read, Update",
                "audit": "Read (all), Export",
                "risk": "Read (all), Trigger recalculation",
                "admin": "Full system access"
            }
    
    return matrix

# -----------------------------------------------------------------------------
# MODULE 3.5: Ledger Entry Management (Admin/Auditor View)
# -----------------------------------------------------------------------------

from app.models.ledger import LedgerEntry
from app.schemas.ledger import LedgerEntryResponse

@router.get("/ledger/all", response_model=List[LedgerEntryResponse])
def get_all_ledger_entries(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.AUDITOR])),
    db: Session = Depends(get_db)
):
    """
    Get all ledger entries (Admin & Auditor only).
    Sorted by latest first.
    """
    entries = db.query(LedgerEntry).order_by(desc(LedgerEntry.created_at)).offset(skip).limit(limit).all()
    return entries


@router.get("/ledger/document/{document_id}", response_model=List[LedgerEntryResponse])
def get_document_ledger_admin(
    document_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.AUDITOR])),
    db: Session = Depends(get_db)
):
    """
    Get complete ledger history for a specific document.
    """
    entries = db.query(LedgerEntry).filter(
        LedgerEntry.document_id == document_id
    ).order_by(desc(LedgerEntry.created_at)).all()
    return entries


@router.get("/ledger/user/{user_id}", response_model=List[LedgerEntryResponse])
def get_user_ledger_admin(
    user_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.AUDITOR])),
    db: Session = Depends(get_db)
):
    """
    Get complete ledger history for a specific user (as actor).
    """
    entries = db.query(LedgerEntry).filter(
        LedgerEntry.actor_id == user_id
    ).order_by(desc(LedgerEntry.created_at)).all()
    return entries


# -----------------------------------------------------------------------------
# MODULE 4: Audit Log Monitoring
# -----------------------------------------------------------------------------

@router.get("/audit/logs")
def list_audit_logs(
    skip: int = 0,
    limit: int = 50,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """View and filter audit logs"""
    query = db.query(AuditLog)
    
    if user_id:
        query = query.filter(AuditLog.admin_id == user_id)
    if action:
        query = query.filter(AuditLog.action == action)
        
    logs = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return logs


# -----------------------------------------------------------------------------
# MODULE 5 & 6: Global Analytics & Integrity
# -----------------------------------------------------------------------------

@router.get("/analytics", response_model=SystemAnalytics)
def get_global_analytics(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Get global system analytics"""
    
    # Counts
    total_orgs = db.query(func.count(Organization.id)).scalar()
    total_users = db.query(func.count(User.id)).scalar()
    total_trades = db.query(func.count(TradeTransaction.id)).scalar()
    total_docs = db.query(func.count(Document.id)).scalar()
    
    # Risk Distribution (Active Users)
    risk_scores = db.query(RiskScore.category, func.count(RiskScore.id))\
        .group_by(RiskScore.category).all()
    risk_dict = {cat: count for cat, count in risk_scores}
    
    # Compliance Violations (High Risk Scores; > 66 is High)
    compliance_issues = db.query(func.count(RiskScore.id))\
        .filter(RiskScore.score > 66).scalar()
    
    return SystemAnalytics(
        total_organizations=total_orgs or 0,
        total_users=total_users or 0,
        total_transactions=total_trades or 0,
        total_documents=total_docs or 0,
        risk_distribution=risk_dict,
        compliance_violations=compliance_issues or 0
    )

@router.get("/integrity/alerts")
def get_integrity_alerts(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Check for system integrity issues:
    1. Document Hash Mismatches (Alert if stored hash != calculated hash - requires calculation, simplified here)
    2. Suspicious Transactions (e.g., rapid trades)
    """
    alerts = []
    
    # 1. Check for High Risk Entities (> 66 is High Risk)
    high_risk_users = db.query(RiskScore).filter(RiskScore.score > 66).all()
    for risk in high_risk_users:
        alerts.append({
            "type": "HIGH_RISK_USER",
            "severity": "CRITICAL",
            "details": f"User {risk.user_id} has critical risk score of {risk.score}",
            "timestamp": risk.last_updated
        })
        
    return alerts
