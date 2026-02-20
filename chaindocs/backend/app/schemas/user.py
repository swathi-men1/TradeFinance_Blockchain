from pydantic import BaseModel, EmailStr
from app.models.enums import UserRole

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole | None = None
    org_id: int | None = None

class UserLogin(BaseModel):
    email:EmailStr
    password: str