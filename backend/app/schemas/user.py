# Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from app.models.user import UserRole


# Request schemas
class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8)
    org_name: str = Field(..., min_length=1, max_length=255)
    # role field removed from input to block tampering


class UserAdminCreate(UserCreate):
    role: UserRole


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    role: UserRole | None = None
    org_name: str | None = None
    password: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Response schemas
class UserResponse(BaseModel):
    id: int
    user_code: str
    name: str
    email: str
    role: UserRole
    org_name: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: int
    email: str
    role: UserRole
    org_name: str
