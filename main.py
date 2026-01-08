from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer

from database import engine, SessionLocal, Base
from models import User

from fastapi import UploadFile, File
import shutil
import os

from models import User, Document
from database import engine, Base
Base.metadata.create_all(bind=engine)


# ---------------- APP ----------------
app = FastAPI()

# Create DB tables
Base.metadata.create_all(bind=engine)

# ---------------- SECURITY ----------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "mysecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ---------------- UTILS ----------------
def hash_password(password: str):
    return pwd_context.hash(password[:72])


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()
        db.close()

        if user is None:
            raise HTTPException(status_code=401, detail="User not found")

        return user

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ---------------- SCHEMAS ----------------
class UserSignup(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str

# ---------------- ROUTES ----------------
@app.get("/")
def home():
    return {"message": "FastAPI backend is running successfully"}


@app.post("/signup")
def signup(user: UserSignup):
    db = SessionLocal()

    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        db.close()
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pwd = hash_password(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_pwd
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    db.close()

    return {
        "message": "User registered successfully",
        "email": user.email
    }


@app.post("/login")
def login(user: LoginRequest):
    db = SessionLocal()

    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user:
        db.close()
        raise HTTPException(status_code=401, detail="Invalid email")

    if not verify_password(user.password, db_user.hashed_password):
        db.close()
        raise HTTPException(status_code=401, detail="Invalid password")

    token = create_access_token({"sub": db_user.email})
    db.close()

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@app.get("/profile")
def profile(current_user: User = Depends(get_current_user)):
    return {
        "name": current_user.name,
        "email": current_user.email
    }


UPLOAD_DIR = "uploads"

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)


from fastapi import FastAPI, UploadFile, File
import os
import hashlib

from models import Document
from database import SessionLocal

@app.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    os.makedirs("uploads", exist_ok=True)

    file_path = f"uploads/{file.filename}"
    contents = await file.read()

    with open(file_path, "wb") as f:
        f.write(contents)

    file_hash = hashlib.sha256(contents).hexdigest()

    # 🔽 THIS IS THE IMPORTANT PART 🔽
    db = SessionLocal()

    new_doc = Document(
        filename=file.filename,
        file_hash=file_hash,
        owner_email="mvramya2003@gmail.com"  # later replace with JWT user
    )

    db.add(new_doc)
    db.commit()
    db.close()

    return {
        "filename": file.filename,
        "hash": file_hash,
        "message": "Document uploaded and saved in DB"
    }
