from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import hashlib

from database.init_db import SessionLocal
from models.user import User

router = APIRouter(prefix="/auth", tags=["Auth"])

# --------------------------------------------------
# DB
# --------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --------------------------------------------------
# SCHEMAS
# --------------------------------------------------
class SignupSchema(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str          # corporate / auditor / admin
    organization: str

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

# --------------------------------------------------
# PASSWORD UTILS (SHA256)
# --------------------------------------------------
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

# --------------------------------------------------
# SIGNUP
# --------------------------------------------------
@router.post("/signup")
def signup(data: SignupSchema, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=data.name,
        email=data.email,
        password=hash_password(data.password),
        role=data.role,
        organization=data.organization
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "Signup successful"}

# --------------------------------------------------
# LOGIN
# --------------------------------------------------
@router.post("/login")
def login(data: LoginSchema, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    request.session["user"] = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "organization": user.organization
    }

    return {
        "message": "Login successful",
        "role": user.role
    }

# --------------------------------------------------
# CURRENT USER
# --------------------------------------------------
@router.get("/me")
def me(request: Request):
    user = request.session.get("user")
    if not user:
        return {"authenticated": False}
    
    # Add authenticated flag to the response
    user["authenticated"] = True
    return user

# --------------------------------------------------
# LOGOUT
# --------------------------------------------------
@router.post("/logout")
def logout(request: Request):
    request.session.clear()
    return {"message": "Logged out"}
@router.get("/debug-session")
def debug_session(request: Request):
    return {
        "session": dict(request.session),
        "cookies": request.cookies,
        "headers": dict(request.headers)
    }
