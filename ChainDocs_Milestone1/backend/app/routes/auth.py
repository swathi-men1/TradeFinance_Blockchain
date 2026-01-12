
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.user import User
from app.core.security import hash_password, verify_password, create_token
from app.database import Base

Base.metadata.create_all(bind=engine)

router = APIRouter(prefix="/auth")

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@router.post("/register")
def register(user: dict, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user["email"]).first():
        raise HTTPException(400, "Email exists")
    u = User(
        name=user["name"],
        email=user["email"],
        password=hash_password(user["password"]),
        role=user["role"],
        org_name=user["org_name"]
    )
    db.add(u)
    db.commit()
    return {"message": "registered"}

@router.post("/login")
def login(data: dict, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.email == data["email"]).first()
    if not u or not verify_password(data["password"], u.password):
        raise HTTPException(401, "invalid credentials")
    return {
        "access_token": create_token({"sub": u.email}, 30)
    }
