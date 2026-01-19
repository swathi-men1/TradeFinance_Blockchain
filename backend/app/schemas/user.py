from pydantic import BaseModel, EmailStr


# Used during signup (Week 2: includes org_id)
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str
    org_id: int


# Used during login
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Used for API responses (never expose password)
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    org_id: int

    class Config:
        orm_mode = True
