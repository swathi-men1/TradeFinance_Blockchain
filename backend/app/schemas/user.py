from pydantic import BaseModel, EmailStr


# -------------------- SIGNUP --------------------
# Users do NOT choose role
# All users register as CORPORATE
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    org_id: int


# -------------------- LOGIN --------------------
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# -------------------- RESPONSE --------------------
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    org_id: int

    class Config:
        orm_mode = True
