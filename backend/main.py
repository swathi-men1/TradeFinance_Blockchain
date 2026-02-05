from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import FileResponse
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
import hashlib, os, mimetypes, re

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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# ================= UTILS =================
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
        role = payload.get("role")

        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()
        db.close()

        if not user or user.role != role:
            raise HTTPException(status_code=401)

        return user
    except JWTError:
        raise HTTPException(status_code=401)

# ================= TAMPER CHECK =================
def is_document_tampered(path: str | None, stored_hash: str) -> bool:
    if not path or not os.path.exists(path):
        return True
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest() != stored_hash

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

# ================= SIGNUP =================
@app.post("/signup")
def signup(user: SignupSchema):
    db = SessionLocal()
    if db.query(User).filter(User.email == user.email).first():
        db.close()
        raise HTTPException(status_code=400, detail="Email already exists")

    db.add(User(
        name=user.name,
        email=user.email,
        hashed_password=hash_password(user.password),
        role="corporate"
    ))
    db.commit()
    db.close()
    return {"message": "Signup successful"}

# ================= LOGIN =================
@app.post("/login")
def login(user: LoginSchema):
    db = SessionLocal()
    db_user = db.query(User).filter(User.email == user.email).first()
    db.close()

    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401)

    token = create_access_token({"sub": db_user.email, "role": db_user.role})
    return {"access_token": token, "token_type": "bearer", "role": db_user.role}

# ================= UPLOAD =================
@app.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "corporate":
        raise HTTPException(status_code=403)

    os.makedirs("uploads", exist_ok=True)
    content = await file.read()
    file_hash = hashlib.sha256(content).hexdigest()

    db = SessionLocal()
    if db.query(Document).filter(
        Document.file_hash == file_hash,
        Document.owner_email == current_user.email
    ).first():
        db.close()
        raise HTTPException(status_code=400, detail="Duplicate document")

    path = os.path.join("uploads", file.filename)
    with open(path, "wb") as f:
        f.write(content)

    doc = Document(
        filename=file.filename,
        file_path=path,
        file_hash=file_hash,
        owner_email=current_user.email,
        status="PENDING"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    db.add(LedgerEntry(
        document_id=doc.id,
        action="UPLOADED",
        actor_email=current_user.email
    ))
    db.commit()
    db.close()

    return {"message": "Uploaded successfully"}

# ================= CORPORATE: MY DOCUMENTS =================
@app.get("/my-documents")
def my_documents(current_user: User = Depends(get_current_user)):
    if current_user.role != "corporate":
        raise HTTPException(status_code=403)

    db = SessionLocal()
    docs = db.query(Document).filter(
        Document.owner_email == current_user.email
    ).all()
    db.close()

    return [{
        "id": d.id,
        "filename": d.filename,
        "status": d.status,
        "tampered": is_document_tampered(d.file_path, d.file_hash)
    } for d in docs]

# ================= ALL DOCUMENTS (BANK / ADMIN / AUDITOR) =================
@app.get("/documents")
def all_documents(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["bank", "admin", "auditor"]:
        raise HTTPException(status_code=403)

    db = SessionLocal()
    docs = db.query(Document).all()
    db.close()

    return [{
        "id": d.id,
        "filename": d.filename,
        "owner_email": d.owner_email,
        "status": d.status,
        "file_hash": d.file_hash,
        "tampered": is_document_tampered(d.file_path, d.file_hash)
    } for d in docs]

# ================= UPDATE STATUS =================
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

    return {"message": "Status updated"}

# ================= HARD DELETE =================
@app.delete("/documents/{doc_id}")
def delete_document(
    doc_id: int,
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "bank", "corporate"]:
        raise HTTPException(status_code=403)

    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            raise HTTPException(status_code=404)

        if current_user.role == "corporate" and doc.owner_email != current_user.email:
            raise HTTPException(status_code=403)

        if doc.file_path and os.path.exists(doc.file_path):
            os.remove(doc.file_path)

        db.delete(doc)
        db.commit()

        return {"message": "Document deleted successfully"}

    finally:
        db.close()

# ================= PREVIEW (PUBLIC) =================
@app.get("/documents/{doc_id}/preview")
def preview_document(doc_id: int):
    db = SessionLocal()
    doc = db.query(Document).filter(Document.id == doc_id).first()
    db.close()

    if not doc or not doc.file_path or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404)

    mime, _ = mimetypes.guess_type(doc.file_path)
    mime = mime or "application/octet-stream"

    disposition = "inline" if doc.filename.lower().endswith(
        (".pdf", ".png", ".jpg", ".jpeg")
    ) else "attachment"

    safe_name = re.sub(r"[^\x00-\x7F]+", "", doc.filename)

    return FileResponse(
        path=doc.file_path,
        media_type=mime,
        headers={"Content-Disposition": f'{disposition}; filename="{safe_name}"'}
    )
