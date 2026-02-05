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
            raise HTTPException(status_code=401, detail="Invalid token")

        return user

    except JWTError:
        raise HTTPException(status_code=401, detail="Token error")


# ================= HASH + TAMPER =================
def calculate_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()

def is_document_tampered(path: str | None, stored_hash: str | None) -> bool:
    if not path or not os.path.exists(path):
        return True

    if not stored_hash:
        return True

    with open(path, "rb") as f:
        current_hash = hashlib.sha256(f.read()).hexdigest()

    return current_hash != stored_hash


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

    new_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hash_password(user.password),
        role="corporate"
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

    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": db_user.email, "role": db_user.role})

    return {"access_token": token, "token_type": "bearer", "role": db_user.role}


# ================= UPLOAD DOCUMENT =================
@app.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "corporate":
        raise HTTPException(status_code=403, detail="Only corporate can upload")

    os.makedirs("uploads", exist_ok=True)

    content = await file.read()
    file_hash = calculate_hash(content)

    db = SessionLocal()

    existing = db.query(Document).filter(
        Document.file_hash == file_hash,
        Document.owner_email == current_user.email,
        Document.is_deleted == False
    ).first()

    if existing:
        db.close()
        raise HTTPException(status_code=400, detail="Duplicate document")

    file_path = os.path.join("uploads", file.filename)

    with open(file_path, "wb") as f:
        f.write(content)

    doc = Document(
        filename=file.filename,
        file_path=file_path,
        file_hash=file_hash,
        owner_email=current_user.email,
        status="PENDING",
        access_role="corporate",
        created_at=datetime.utcnow(),
        uploaded_at=datetime.utcnow(),
        is_deleted=False
    )

    db.add(doc)
    db.commit()
    db.refresh(doc)

    db.add(LedgerEntry(
        document_id=doc.id,
        action="UPLOADED",
        actor_email=current_user.email,
        timestamp=datetime.utcnow(),
        created_at=datetime.utcnow(),
        event_data={"filename": file.filename, "hash": file_hash}
    ))

    db.commit()
    db.close()

    return {"message": "Uploaded successfully", "doc_id": doc.id}


# ================= CORPORATE: MY DOCUMENTS =================
@app.get("/my-documents")
def my_documents(current_user: User = Depends(get_current_user)):
    if current_user.role != "corporate":
        raise HTTPException(status_code=403, detail="Only corporate allowed")

    db = SessionLocal()
    docs = db.query(Document).filter(
        Document.owner_email == current_user.email,
        Document.is_deleted == False
    ).all()

    result = []
    for d in docs:
        result.append({
            "id": d.id,
            "filename": d.filename,
            "status": d.status,
            "uploaded_at": d.uploaded_at,
            "tampered": is_document_tampered(d.file_path, d.file_hash)
        })

    db.close()
    return result


# ================= ALL DOCUMENTS =================
@app.get("/documents")
def all_documents(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["bank", "admin", "auditor"]:
        raise HTTPException(status_code=403, detail="Not allowed")

    db = SessionLocal()

    # ✅ Admin can view deleted also
    if current_user.role == "admin":
        docs = db.query(Document).all()
    else:
        docs = db.query(Document).filter(Document.is_deleted == False).all()

    result = []
    for d in docs:
        result.append({
            "id": d.id,
            "filename": d.filename,
            "owner_email": d.owner_email,
            "status": d.status,
            "file_hash": d.file_hash,
            "file_path": d.file_path,
            "uploaded_at": d.uploaded_at,
            "is_deleted": d.is_deleted,
            "deleted_by": d.deleted_by,
            "deleted_at": d.deleted_at,
            "delete_reason": d.delete_reason,
            "tampered": is_document_tampered(d.file_path, d.file_hash)
        })

    db.close()
    return result


# ================= UPDATE STATUS =================
@app.put("/documents/{doc_id}/status")
def update_status(
    doc_id: int,
    status: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "bank":
        raise HTTPException(status_code=403, detail="Only bank can update status")

    if status not in ["PENDING", "ACCEPTED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    db = SessionLocal()
    doc = db.query(Document).filter(
        Document.id == doc_id,
        Document.is_deleted == False
    ).first()

    if not doc:
        db.close()
        raise HTTPException(status_code=404, detail="Document not found")

    doc.status = status

    db.add(LedgerEntry(
        document_id=doc.id,
        action=f"STATUS_{status}",
        actor_email=current_user.email,
        timestamp=datetime.utcnow(),
        created_at=datetime.utcnow(),
        event_data={"new_status": status}
    ))

    db.commit()
    db.close()

    return {"message": "Status updated successfully"}


# ================= SOFT DELETE + QUARANTINE =================
@app.delete("/documents/{doc_id}")
def delete_document(
    doc_id: int,
    reason: str = "USER_REQUEST",
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "bank", "corporate"]:
        raise HTTPException(status_code=403, detail="Not allowed")

    db = SessionLocal()

    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()

        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        if doc.is_deleted:
            raise HTTPException(status_code=400, detail="Already deleted")

        if current_user.role == "corporate" and doc.owner_email != current_user.email:
            raise HTTPException(status_code=403, detail="Not allowed")

        if doc.file_path and os.path.exists(doc.file_path):
            os.makedirs("quarantine", exist_ok=True)

            new_path = os.path.join("quarantine", doc.filename)

            if os.path.exists(new_path):
                name, ext = os.path.splitext(doc.filename)
                new_path = os.path.join("quarantine", f"{name}_{doc.id}{ext}")

            os.rename(doc.file_path, new_path)
            doc.file_path = new_path

        doc.is_deleted = True
        doc.deleted_by = current_user.email
        doc.deleted_at = datetime.utcnow()
        doc.delete_reason = reason

        db.add(LedgerEntry(
            document_id=doc.id,
            action="DELETED",
            actor_email=current_user.email,
            timestamp=datetime.utcnow(),
            created_at=datetime.utcnow(),
            event_data={"reason": reason}
        ))

        db.commit()
        return {"message": "Document moved to quarantine and soft deleted"}

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        print("DELETE ERROR:", e)
        raise HTTPException(status_code=500, detail="Delete failed")

    finally:
        db.close()


# ================= RESTORE DOCUMENT =================
@app.put("/documents/{doc_id}/restore")
def restore_document(doc_id: int, current_user: User = Depends(get_current_user)):

    if current_user.role not in ["admin", "bank"]:
        raise HTTPException(status_code=403, detail="Not allowed")

    db = SessionLocal()
    doc = db.query(Document).filter(Document.id == doc_id).first()

    if not doc:
        db.close()
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.is_deleted == False:
        db.close()
        raise HTTPException(status_code=400, detail="Document is not deleted")

    quarantine_path = doc.file_path
    uploads_path = os.path.join("uploads", doc.filename)

    if not quarantine_path or not os.path.exists(quarantine_path):
        db.close()
        raise HTTPException(status_code=404, detail="File not found in quarantine")

    os.makedirs("uploads", exist_ok=True)
    os.rename(quarantine_path, uploads_path)

    doc.file_path = uploads_path
    doc.is_deleted = False
    doc.deleted_at = None
    doc.deleted_by = None
    doc.delete_reason = None

    db.add(LedgerEntry(
        document_id=doc.id,
        action="RESTORED",
        actor_email=current_user.email,
        timestamp=datetime.utcnow(),
        created_at=datetime.utcnow(),
        event_data={"message": "Document restored from quarantine"}
    ))

    db.commit()
    db.close()

    return {"message": "Document restored successfully"}


# ================= LEDGER HISTORY =================
@app.get("/documents/{doc_id}/ledger")
def get_ledger_history(doc_id: int, current_user: User = Depends(get_current_user)):

    if current_user.role not in ["admin", "bank", "auditor"]:
        raise HTTPException(status_code=403, detail="Not allowed")

    db = SessionLocal()

    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        db.close()
        raise HTTPException(status_code=404, detail="Document not found")

    ledger_entries = db.query(LedgerEntry).filter(
        LedgerEntry.document_id == doc_id
    ).order_by(LedgerEntry.timestamp.asc()).all()

    result = []
    for entry in ledger_entries:
        result.append({
            "id": entry.id,
            "action": entry.action,
            "actor_email": entry.actor_email,
            "timestamp": entry.timestamp,
            "event_data": entry.event_data
        })

    db.close()
    return result


# ================= PREVIEW (PUBLIC) =================
@app.get("/documents/{doc_id}/preview")
def preview_document(doc_id: int):
    db = SessionLocal()
    doc = db.query(Document).filter(Document.id == doc_id).first()
    db.close()

    if not doc or not doc.file_path or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found")

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
