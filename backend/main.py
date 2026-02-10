from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import FileResponse
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
import hashlib, os, mimetypes, re
from sqlalchemy import or_

from database import SessionLocal, engine, Base
from models import User, Document, LedgerEntry, Transaction


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


# ================= EXTERNAL COUNTRY RISK =================
COUNTRY_RISK_MAP = {
    "India": 10,
    "USA": 15,
    "UK": 15,
    "China": 25,
    "Russia": 40,
    "Pakistan": 60,
    "Afghanistan": 80,
    "North Korea": 100
}


def get_external_risk_score(country: str):
    return COUNTRY_RISK_MAP.get(country, 30)


# ================= RISK SCORING =================
def calculate_user_risk(db, user_email: str):

    user = db.query(User).filter(User.email == user_email).first()
    user_country = user.country if user and user.country else "Unknown"

    # ---------- DOCUMENT INTEGRITY ----------
    docs = db.query(Document).filter(Document.owner_email == user_email).all()

    total_docs = len(docs)
    tampered_docs = 0
    rejected_docs = 0

    for d in docs:
        if is_document_tampered(d.file_path, d.file_hash):
            tampered_docs += 1
        if d.status == "REJECTED":
            rejected_docs += 1

    doc_score = 0
    if total_docs > 0:
        tamper_ratio = tampered_docs / total_docs
        reject_ratio = rejected_docs / total_docs

        if tamper_ratio == 0 and reject_ratio == 0:
            doc_score = 0
        elif tamper_ratio <= 0.3 or reject_ratio <= 0.3:
            doc_score = 40
        elif tamper_ratio <= 0.6 or reject_ratio <= 0.6:
            doc_score = 70
        else:
            doc_score = 100

    # ---------- LEDGER ACTIVITY ----------
    ledgers = db.query(LedgerEntry).filter(LedgerEntry.actor_email == user_email).all()

    suspicious_actions = 0
    for l in ledgers:
        if l.action in ["DELETED", "STATUS_REJECTED"]:
            suspicious_actions += 1

    ledger_score = 0
    if suspicious_actions == 0:
        ledger_score = 0
    elif suspicious_actions <= 2:
        ledger_score = 30
    elif suspicious_actions <= 5:
        ledger_score = 60
    else:
        ledger_score = 100

    # ---------- TRANSACTION BEHAVIOR ----------
    txns = db.query(Transaction).filter(
        or_(
            Transaction.buyer_email == user_email,
            Transaction.seller_email == user_email
        )
    ).all()

    total_txns = len(txns)
    delayed = 0
    disputes = 0
    cancelled = 0

    for t in txns:
        if t.status == "DELAYED":
            delayed += 1
        if t.status == "DISPUTED":
            disputes += 1
        if t.status == "CANCELLED":
            cancelled += 1

    transaction_score = 0
    if total_txns > 0:
        issue_ratio = (delayed + disputes + cancelled) / total_txns

        if issue_ratio == 0:
            transaction_score = 0
        elif issue_ratio <= 0.3:
            transaction_score = 40
        elif issue_ratio <= 0.6:
            transaction_score = 70
        else:
            transaction_score = 100

    # ---------- EXTERNAL RISK ----------
    external_score = get_external_risk_score(user_country)

    # ---------- FINAL WEIGHTED SCORE ----------
    final_score = (
        doc_score * 0.40 +
        ledger_score * 0.30 +
        transaction_score * 0.20 +
        external_score * 0.10
    )

    final_score = int(final_score)

    if final_score <= 30:
        level = "LOW"
    elif final_score <= 70:
        level = "MEDIUM"
    else:
        level = "HIGH"

    reason = (
        f"Docs={total_docs}, Tampered={tampered_docs}, RejectedDocs={rejected_docs}, "
        f"SuspiciousActions={suspicious_actions}, Transactions={total_txns}, "
        f"Delayed={delayed}, Disputes={disputes}, Cancelled={cancelled}, "
        f"Country={user_country}"
    )

    return final_score, level, reason


def update_user_risk_score(db, user_email: str):
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        return

    score, level, reason = calculate_user_risk(db, user_email)

    user.risk_score = score
    user.risk_level = level
    user.risk_reason = reason
    user.risk_updated_at = datetime.utcnow()

    db.commit()


# ================= SCHEMAS =================
class SignupSchema(BaseModel):
    name: str
    email: str
    password: str
    country: str = "India"


class LoginSchema(BaseModel):
    email: str
    password: str


class TransactionSchema(BaseModel):
    buyer_email: str
    seller_email: str
    status: str
    remarks: str | None = None


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
        country=user.country
    )

    db.add(new_user)
    db.commit()

    update_user_risk_score(db, user.email)

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

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": db_user.role,
        "email": db_user.email
    }


# ================= CREATE TRANSACTION =================
@app.post("/transactions")
def create_transaction(txn: TransactionSchema, current_user: User = Depends(get_current_user)):

    if current_user.role not in ["admin", "bank"]:
        raise HTTPException(status_code=403, detail="Only admin/bank can create transactions")

    if txn.status not in ["PENDING", "COMPLETED", "CANCELLED", "DISPUTED", "DELAYED"]:
        raise HTTPException(status_code=400, detail="Invalid transaction status")

    db = SessionLocal()

    new_txn = Transaction(
        buyer_email=txn.buyer_email,
        seller_email=txn.seller_email,
        status=txn.status,
        remarks=txn.remarks,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(new_txn)
    db.commit()

    update_user_risk_score(db, txn.buyer_email)
    update_user_risk_score(db, txn.seller_email)

    db.close()

    return {"message": "Transaction created successfully"}


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
    update_user_risk_score(db, current_user.email)

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
def update_status(doc_id: int, status: str, current_user: User = Depends(get_current_user)):

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
    update_user_risk_score(db, doc.owner_email)

    db.close()
    return {"message": "Status updated successfully"}


# ================= SOFT DELETE + QUARANTINE =================
@app.delete("/documents/{doc_id}")
def delete_document(doc_id: int, reason: str = "USER_REQUEST", current_user: User = Depends(get_current_user)):

    if current_user.role not in ["admin", "bank", "corporate"]:
        raise HTTPException(status_code=403, detail="Not allowed")

    db = SessionLocal()

    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        db.close()
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.is_deleted:
        db.close()
        raise HTTPException(status_code=400, detail="Already deleted")

    if current_user.role == "corporate" and doc.owner_email != current_user.email:
        db.close()
        raise HTTPException(status_code=403, detail="Not allowed")

    if doc.file_path and os.path.exists(doc.file_path):
        os.makedirs("quarantine", exist_ok=True)

        safe_filename = f"{doc.id}_{doc.filename}"
        new_path = os.path.join("quarantine", safe_filename)

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
    update_user_risk_score(db, doc.owner_email)

    db.close()
    return {"message": "Document moved to quarantine and soft deleted"}


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
    update_user_risk_score(db, doc.owner_email)

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


# ================= VIEW USER RISK SCORE =================
@app.get("/users/{email}/risk-score")
def get_risk_score(email: str, current_user: User = Depends(get_current_user)):

    if current_user.role not in ["admin", "bank", "auditor", "corporate"]:
        raise HTTPException(status_code=403, detail="Not allowed")

    # corporate only can view own risk score
    if current_user.role == "corporate" and current_user.email != email:
        raise HTTPException(status_code=403, detail="Corporate can view only own risk score")

    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()

    if not user:
        db.close()
        raise HTTPException(status_code=404, detail="User not found")

    update_user_risk_score(db, email)

    user = db.query(User).filter(User.email == email).first()
    db.close()

    return {
        "email": user.email,
        "country": user.country,
        "risk_score": user.risk_score,
        "risk_level": user.risk_level,
        "risk_reason": user.risk_reason,
        "risk_updated_at": user.risk_updated_at
    }


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
