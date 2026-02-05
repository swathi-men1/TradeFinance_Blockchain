# /* Author: Abdul Samad | */
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.session import get_db
from db.models import AuditLog, UserProfiles, Documents, RoleEnum
from api.modules.auth.routes import get_current_user
# Note: Creating a custom response schema on the fly or updating schemas.py is needed.
# For now, let's just return a dict/json structure that matches the requirement.

router = APIRouter()

from services.audit_service import AuditService

from schemas import AuditLogResponse

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(db: Session = Depends(get_db), current_user: UserProfiles = Depends(get_current_user)):
    # RBAC: Admin & Auditor only
    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if user_role not in ["admin", "auditor"]:
        raise HTTPException(status_code=403, detail="Not authorized to view audit logs.")

    return AuditService.get_enriched_logs(db)
