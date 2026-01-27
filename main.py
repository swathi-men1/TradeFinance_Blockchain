from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
import hashlib, os, shutil

from database import SessionLocal, engine, Base
from models import User, Document, LedgerEntry

# ---------------- APP ----------------
app = FastAPI()

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DB ----------------
Base.metadata.create_all(bind=engine)

# ---------------- SECURITY ----------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "mysecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ---------------- UTILS ----------------
def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    data.update({"exp": expire})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")

        if not email:
            raise HTTPException(status_code=401)

        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()
        db.close()

        if not user:
            raise HTTPException(status_code=401)

        return user
    except JWTError:
        raise HTTPException(status_code=401)

# ---------------- SCHEMAS ----------------
class SignupSchema(BaseModel):
    name: str
    email: str
    password: str

class LoginSchema(BaseModel):
    email: str
    password: str

# ---------------- ROUTES ----------------
@app.get("/")
def home():
    return {"message": "Backend running"}

# ---------------- SIGNUP (Corporate only) ----------------
@app.post("/signup")
def signup(user: SignupSchema):
    db = SessionLocal()

    if db.query(User).filter(User.email == user.email).first():
        db.close()
        raise HTTPException(status_code=400, detail="Email already exists")

    new_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hash_password(user.password),
        role="corporate",
        status="ACTIVE"
    )

    db.add(new_user)
    db.commit()
    db.close()

    return {"message": "Signup successful"}

# ---------------- LOGIN ----------------
@app.post("/login")
def login(user: LoginSchema):
    db = SessionLocal()
    db_user = db.query(User).filter(User.email == user.email).first()
    db.close()

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 🔴 USER STATUS CHECK (IMPORTANT)
    if db_user.status != "ACTIVE":
        raise HTTPException(
            status_code=403,
            detail="User blocked by admin"
        )

    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({
        "sub": db_user.email,
        "role": db_user.role
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": db_user.role
    }

# ---------------- UPLOAD DOCUMENT (CORPORATE) ----------------
@app.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "corporate":
        raise HTTPException(status_code=403)

    os.makedirs("uploads", exist_ok=True)
    path = f"uploads/{file.filename}"

    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    with open(path, "rb") as f:
        file_hash = hashlib.sha256(f.read()).hexdigest()

    db = SessionLocal()
    doc = Document(
        filename=file.filename,
        file_hash=file_hash,
        owner_email=current_user.email,
        status="PENDING"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    ledger = LedgerEntry(
        document_id=doc.id,
        action="ISSUED",
        actor_email=current_user.email
    )
    db.add(ledger)
    db.commit()
    db.close()

    return {"message": "Document uploaded", "status": "PENDING"}

# ---------------- MY DOCUMENTS (CORPORATE) ----------------
@app.get("/my-documents")
def my_documents(current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    docs = db.query(Document).filter(
        Document.owner_email == current_user.email
    ).all()
    db.close()
    return docs

# ---------------- ALL DOCUMENTS (BANK / AUDITOR / ADMIN) ----------------
@app.get("/documents")
def all_documents(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["bank", "auditor", "admin"]:
        raise HTTPException(status_code=403)

    db = SessionLocal()
    docs = db.query(Document).all()
    db.close()
    return docs

# ---------------- UPDATE STATUS (BANK ONLY) ----------------
@app.put("/documents/{doc_id}/status")
def update_status(
    doc_id: int,
    status: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "bank":
        raise HTTPException(status_code=403)

    if status not in ["PENDING", "ACCEPTED", "REJECTED"]:
        raise HTTPException(status_code=400)

    db = SessionLocal()
    doc = db.query(Document).filter(Document.id == doc_id).first()

    if not doc:
        db.close()
        raise HTTPException(status_code=404)

    doc.status = status

    ledger = LedgerEntry(
        document_id=doc.id,
        action=f"STATUS_{status}",
        actor_email=current_user.email
    )
    db.add(ledger)
    db.commit()
    db.close()

    return {"message": "Status updated", "status": status}

# ---------------- ADMIN: USER MANAGEMENT ----------------
@app.get("/admin/users")
def get_users(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403)

    db = SessionLocal()
    users = db.query(User).all()
    db.close()
    return users

@app.put("/admin/users/{email}/status")
def update_user_status(
    email: str,
    status: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403)

    if status not in ["ACTIVE", "BLOCKED"]:
        raise HTTPException(status_code=400)

    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()

    if not user:
        db.close()
        raise HTTPException(status_code=404)

    user.status = status
    db.commit()
    db.close()

    return {"message": "User status updated"}
@app.put("/documents/{doc_id}/access-role")
def update_access_role(
    doc_id: int,
    role: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403)

    if role not in ["bank", "auditor", "corporate"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    db = SessionLocal()
    doc = db.query(Document).filter(Document.id == doc_id).first()

    if not doc:
        db.close()
        raise HTTPException(status_code=404)

    doc.access_role = role
    db.commit()
    db.close()

    return {"message": "Access role updated", "role": role}
