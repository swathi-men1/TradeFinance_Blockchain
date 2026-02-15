from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.user import UserRole
from app.models.organization import OrganizationStatus

# Organization Schemas
class OrgCreate(BaseModel):
    org_name: str
    status: OrganizationStatus = OrganizationStatus.ACTIVE

class OrgUpdate(BaseModel):
    status: Optional[OrganizationStatus] = None

class OrgResponse(BaseModel):
    id: int
    org_name: str
    status: OrganizationStatus
    created_at: datetime

    class Config:
        from_attributes = True

# User Management Schemas
class AdminUserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: UserRole
    org_name: str
    is_active: bool = True

class AdminUserUpdateRole(BaseModel):
    role: UserRole

class AdminUserStatus(BaseModel):
    is_active: bool

# Analytics Schemas
class SystemAnalytics(BaseModel):
    total_organizations: int
    total_users: int
    total_transactions: int
    total_documents: int
    risk_distribution: dict
    compliance_violations: int


from app.schemas.user import UserResponse

# ... existing imports ...

# Audit Log Schemas
class AuditLogResponse(BaseModel):
    id: int
    admin_id: Optional[int]
    admin: Optional[UserResponse]  # Include user details
    action: str
    target_type: Optional[str]
    target_id: Optional[int]
    timestamp: datetime

    class Config:
        from_attributes = True


class AuditLogFilter(BaseModel):
    user_id: Optional[int] = None
    action: Optional[str] = None
    target_type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

