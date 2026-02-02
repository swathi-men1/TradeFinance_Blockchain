from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import FileResponse
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
import hashlib, os, shutil, mimetypes, re

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
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        role = payload.get("role")

        if not email or not role:
            raise HTTPException(status_code=401)

        db = SessionLocal()
        user = db.query(User).filter(User.email == email).first()
        db.close()

        if not user or user.role != role:
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

    if not db_user or not verify_password(user.password, db_user.hashed_password):
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

# ================= UPLOAD DOCUMENT (✅ DUPLICATE CHECK FIXED) =================
@app.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "corporate":
        raise HTTPException(status_code=403)

    os.makedirs("uploads", exist_ok=True)

    # Read file once
    content = await file.read()
    file_hash = hashlib.sha256(content).hexdigest()

    db = SessionLocal()

    # 🔥 DUPLICATE CHECK (DB compare)
    existing = db.query(Document).filter(
        Document.file_hash == file_hash,
        Document.owner_email == current_user.email
    ).first()

    if existing:
        db.close()
        raise HTTPException(status_code=400, detail="Document already exists")

    # Save file
    file_path = os.path.join("uploads", file.filename)
    with open(file_path, "wb") as f:
        f.write(content)

    # Insert document
    doc = Document(
        filename=file.filename,
        file_hash=file_hash,
        owner_email=current_user.email,
        status="PENDING"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Ledger entry
    db.add(LedgerEntry(
        document_id=doc.id,
        action="ISSUED",
        actor_email=current_user.email
    ))
    db.commit()
    db.close()

    return {"message": "Uploaded successfully"}

# ================= CORPORATE DOCUMENTS =================
@app.get("/my-documents")
def my_documents(current_user: User = Depends(get_current_user)):
    if current_user.role != "corporate":
        raise HTTPException(status_code=403)

    db = SessionLocal()
    docs = db.query(Document).filter(
        Document.owner_email == current_user.email
    ).all()
    db.close()
    return docs

# ================= DELETE DOCUMENT =================
@app.delete("/documents/{doc_id}")
def delete_document(doc_id: int, current_user: User = Depends(get_current_user)):
    if current_user.role != "corporate":
        raise HTTPException(status_code=403)

    db = SessionLocal()
    doc = db.query(Document).filter(Document.id == doc_id).first()

    if not doc:
        db.close()
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.owner_email != current_user.email:
        db.close()
        raise HTTPException(status_code=403)

    if doc.status != "PENDING":
        db.close()
        raise HTTPException(status_code=400, detail="Cannot delete processed document")

    file_path = os.path.join("uploads", doc.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(doc)
    db.commit()
    db.close()

    return {"message": "Document deleted successfully"}

# ================= ALL DOCUMENTS (BANK / ADMIN) =================
@app.get("/documents")
def all_documents(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["bank", "admin", "auditor"]:
        raise HTTPException(status_code=403)

    db = SessionLocal()
    docs = db.query(Document).all()
    db.close()
    return docs

# ================= BANK UPDATE STATUS =================
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

# ================= PREVIEW DOCUMENT (PUBLIC) =================
@app.get("/documents/{doc_id}/preview")
def preview_document(doc_id: int):
    db = SessionLocal()
    doc = db.query(Document).filter(Document.id == doc_id).first()
    db.close()

    if not doc:
        raise HTTPException(status_code=404)

    file_path = os.path.join("uploads", doc.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404)

    mime_type, _ = mimetypes.guess_type(file_path)
    if not mime_type:
        mime_type = "application/octet-stream"

    inline_types = (".pdf", ".png", ".jpg", ".jpeg")
    disposition = "inline" if doc.filename.lower().endswith(inline_types) else "attachment"

    safe_name = re.sub(r"[^\x00-\x7F]+", "", doc.filename)

    return FileResponse(
        path=file_path,
        media_type=mime_type,
        headers={
            "Content-Disposition": f'{disposition}; filename="{safe_name}"'
        }
    )
