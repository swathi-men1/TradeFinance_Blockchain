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


# ================= APP =================
app = FastAPI()

# ================= CORS =================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= DB =================
Base.metadata.create_all(bind=engine)

# ================= SECURITY =================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "mysecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ================= UTILS =================
def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict):
    data["exp"] = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
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

# ================= SCHEMAS =================
class SignupSchema(BaseModel):
    name: str
    email: str
    password: str

class LoginSchema(BaseModel):
    email: str
    password: str

# ================= ROUTES =================
@app.get("/")
def home():
    return {"message": "Backend running successfully ✅"}

# ================= SIGNUP (Corporate) =================
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

# ================= LOGIN =================
@app.post("/login")
def login(user: LoginSchema):
    db = SessionLocal()
    db_user = db.query(User).filter(User.email == user.email).first()
    db.close()

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if db_user.status != "ACTIVE":
        raise HTTPException(status_code=403, detail="User blocked by admin")

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

# ================= UPLOAD DOCUMENT =================
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
        status="PENDING",
        access_role="corporate"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    db.add(LedgerEntry(
        document_id=doc.id,
        action="ISSUED",
        actor_email=current_user.email
    ))
    db.commit()
    db.close()

    return {"message": "Document uploaded", "status": "PENDING"}

# ================= MY DOCUMENTS =================
@app.get("/my-documents")
def my_documents(current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    docs = db.query(Document).filter(
        Document.owner_email == current_user.email
    ).all()
    db.close()
    return docs

# ================= ALL DOCUMENTS =================
@app.get("/documents")
def all_documents(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["bank", "auditor", "admin"]:
        raise HTTPException(status_code=403)

    db = SessionLocal()
    docs = db.query(Document).all()
    db.close()
    return docs

# ================= BANK: UPDATE STATUS =================
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

    db.add(LedgerEntry(
        document_id=doc.id,
        action=f"STATUS_{status}",
        actor_email=current_user.email
    ))
    db.commit()
    db.close()

    return {"message": "Status updated", "status": status}

# ================= ADMIN: UPDATE ACCESS ROLE =================
@app.put("/documents/{doc_id}/access-role")
def update_access_role(
    doc_id: int,
    role: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403)

    if role not in ["corporate", "bank", "auditor"]:
        raise HTTPException(status_code=400)

    db = SessionLocal()
    doc = db.query(Document).filter(Document.id == doc_id).first()

    if not doc:
        db.close()
        raise HTTPException(status_code=404)

    doc.access_role = role
    db.commit()
    db.close()

    return {"message": "Access role updated", "role": role}

# ---------------- DELETE DOCUMENT (CORPORATE - ONLY PENDING) ----------------
@app.delete("/documents/{doc_id}/delete")
def delete_document(
    doc_id: int,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "corporate":
        raise HTTPException(status_code=403, detail="Only corporate can delete")

    db = SessionLocal()
    doc = db.query(Document).filter(
        Document.id == doc_id,
        Document.owner_email == current_user.email
    ).first()

    if not doc:
        db.close()
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.status != "PENDING":
        db.close()
        raise HTTPException(
            status_code=400,
            detail="Cannot delete processed document"
        )

    file_path = f"uploads/{doc.filename}"
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(doc)
    db.commit()
    db.close()

    return {"message": "Document deleted successfully"}
