from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------- SIGNUP --------------------
@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Create new user (Week 2: includes org_id)
    new_user = User(
        email=user.email,
        hashed_password=hash_password(user.password),
        role=user.role,
        org_id=user.org_id
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User created successfully"}


# -------------------- LOGIN --------------------
@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user or not verify_password(
        user.password, db_user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    # Create JWT (include role + org_id for RBAC & scoping)
    token = create_access_token(
        data={
            "sub": db_user.email,
            "role": db_user.role,
            "org_id": db_user.org_id,
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }
