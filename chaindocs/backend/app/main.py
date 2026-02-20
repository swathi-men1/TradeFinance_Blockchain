from fastapi import FastAPI
from app.core.database import engine, Base, SessionLocal
from app.schemas.user import UserCreate
from app.core.security import hash_password
from app.models.users import User
from app.schemas.user import UserLogin
from app.core.security import verify_password
from fastapi import HTTPException
from app.core.jwt import create_access_token
from app.core.dependencies import get_current_user
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Depends
from app.models.document import Document
from fastapi import UploadFile, File
import hashlib
from app.core.dependencies import require_roles
from app.models.organization import Organization 
from app.models.ledger import Ledger
from datetime import datetime


app = FastAPI()
print(User.__table__.columns.keys())

Base.metadata.create_all(bind=engine)

import hashlib

def generate_block_hash(document_id, action, file_hash, previous_hash, timestamp):
    block_string = f"{document_id}{action}{file_hash}{previous_hash}{timestamp}"
    return hashlib.sha256(block_string.encode()).hexdigest()

@app.get("/")
def root():
    return {"message": "ChainDocs backend is running"}

#registration
@app.post("/register")
def register(user: UserCreate):
    db = SessionLocal()

    hashed_pw = hash_password(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_pw,
        role=user.role,
        org_id=user.org_id
        
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    db.close()

    return {"message": "User registered successfully"}

#login
@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = SessionLocal()

    existing_user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not existing_user:
        db.close()
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(form_data.password, existing_user.hashed_password):
        db.close()
        raise HTTPException(status_code=401, detail="Invalid password")

    access_token = create_access_token(
        data={"sub": existing_user.email}
    )

    db.close()

    return {
        "access_token": access_token,
        "token_type": "bearer"
        }

@app.get("/me")
def read_current_user(current_user: User = Depends(get_current_user)):
    return {
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    }

@app.post("/upload-document")
def upload_document(
    file: UploadFile = File(...),
    current_user = Depends(require_roles(["corporate"]))
):
    db = SessionLocal()

    try:
        content = file.file.read()
        file_hash = hashlib.sha256(content).hexdigest()

        new_doc = Document(
            filename=file.filename,
            file_hash=file_hash,
            uploaded_by=current_user.id,
            version=1,
            status="PENDING"
        )

        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)

        timestamp = datetime.utcnow()

        block_hash = generate_block_hash(
            new_doc.id,
            "UPLOAD",
            file_hash,
            None,
            timestamp
        )

        ledger_entry = Ledger(
            document_id=new_doc.id,
            action="UPLOAD",
            hash=block_hash,
            previous_hash=None,
            performed_by=current_user.id,
            timestamp=timestamp
        )

        db.add(ledger_entry)
        db.commit()

        return {
            "message": "Document uploaded successfully",
            "document_id": new_doc.id,
            "block_hash": block_hash
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        db.close()

@app.post("/create-org")
def create_org():
    db = SessionLocal()

    new_org = Organization(name="Default Org")
    db.add(new_org)
    db.commit()
    db.refresh(new_org)
    db.close()

    return {"message": "Organization created", "org_id": new_org.id}

@app.get("/ledger")
def view_ledger(
    current_user = Depends(require_roles(["admin", "bank", "auditor"]))
):
    db = SessionLocal()

    entries = db.query(Ledger).all()

    result = []

    for entry in entries:
        result.append({
            "id": entry.id,
            "document_id": entry.document_id,
            "action": entry.action,
            "hash": entry.hash,
            "performed_by": entry.performed_by,
            "timestamp": entry.timestamp
        })

    db.close()

    return result

@app.post("/amend-document/{document_id}")
def amend_document(
    document_id: int,
    file: UploadFile = File(...),
    current_user = Depends(require_roles(["corporate"]))
):
    db = SessionLocal()

    existing_doc = db.query(Document).filter(Document.id == document_id).first()

    if not existing_doc:
        db.close()
        raise HTTPException(status_code=404, detail="Document not found")

    if existing_doc.status == "VERIFIED":
        db.close()
        raise HTTPException(
            status_code=400,
            detail="Cannot amend a verified document"
        )

    content = file.file.read()
    new_hash = hashlib.sha256(content).hexdigest()

    existing_doc.version += 1
    existing_doc.file_hash = new_hash

    db.commit()
    db.refresh(existing_doc)

    updated_version = existing_doc.version

    # 🔗 Blockchain chaining
    last_entry = db.query(Ledger).filter(
        Ledger.document_id == existing_doc.id
    ).order_by(Ledger.id.desc()).first()

    previous_hash = last_entry.hash if last_entry else None

    timestamp = datetime.utcnow()

    block_hash = generate_block_hash(
    existing_doc.id,
    "AMEND",
    new_hash,
    previous_hash,
    timestamp
)

    ledger_entry = Ledger(
    document_id=existing_doc.id,
    action="AMEND",
    hash=block_hash,
    previous_hash=previous_hash,
    performed_by=current_user.id,
    timestamp=timestamp
)

    db.add(ledger_entry)
    db.commit()

    db.close()

    return {
        "message": "Document amended successfully",
        "new_version": updated_version,
        "new_hash": new_hash
    }


@app.get("/document/{document_id}/history")
def document_history(
    document_id: int,
    current_user = Depends(require_roles(["admin", "bank", "auditor"]))
):
    db = SessionLocal()

    entries = db.query(Ledger).filter(
        Ledger.document_id == document_id
    ).all()

    if not entries:
        db.close()
        raise HTTPException(status_code=404, detail="No history found")

    result = []

    for entry in entries:
        result.append({
            "action": entry.action,
            "hash": entry.hash,
            "previous_hash": entry.previous_hash,
            "performed_by": entry.performed_by,
            "timestamp": entry.timestamp
        })

    db.close()

    return result
@app.get("/document/{document_id}")
def get_document(
    document_id: int,
    current_user = Depends(require_roles(["admin", "bank", "corporate", "auditor"]))
):
    db = SessionLocal()

    document = db.query(Document).filter(Document.id == document_id).first()

    if not document:
        db.close()
        raise HTTPException(status_code=404, detail="Document not found")

    result = {
        "id": document.id,
        "filename": document.filename,
        "version": document.version,
        "status": document.status,
        "hash": document.file_hash
    }

    db.close()
    return result

@app.post("/verify-document/{document_id}")
def verify_document(
    document_id: int,
    current_user = Depends(require_roles(["bank"]))
):
    db = SessionLocal()

    try:
        document = db.query(Document).filter(Document.id == document_id).first()

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        if document.status != "PENDING":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot verify document with status {document.status}"
            )

        document.status = "VERIFIED"
        db.commit()

        last_entry = db.query(Ledger).filter(
            Ledger.document_id == document.id
        ).order_by(Ledger.id.desc()).first()

        previous_hash = last_entry.hash if last_entry else None
        timestamp = datetime.utcnow()

        block_hash = generate_block_hash(
            document.id,
            "VERIFY",
            document.file_hash,
            previous_hash,
            timestamp
        )

        ledger_entry = Ledger(
            document_id=document.id,
            action="VERIFY",
            hash=block_hash,
            previous_hash=previous_hash,
            performed_by=current_user.id,
            timestamp=timestamp
        )

        db.add(ledger_entry)
        db.commit()

        return {
            "message": "Document verified successfully",
            "block_hash": block_hash
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        db.close()

@app.post("/reject-document/{document_id}")
def reject_document(
    document_id: int,
    reason: str,
    current_user = Depends(require_roles(["bank"]))
):
    db = SessionLocal()

    try:
        document = db.query(Document).filter(Document.id == document_id).first()

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        if document.status != "PENDING":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot reject document with status {document.status}"
            )

        document.status = "REJECTED"
        document.rejection_reason = reason
        db.commit()

        last_entry = db.query(Ledger).filter(
            Ledger.document_id == document.id
        ).order_by(Ledger.id.desc()).first()

        previous_hash = last_entry.hash if last_entry else None
        timestamp = datetime.utcnow()

        block_hash = generate_block_hash(
            document.id,
            "REJECT",
            document.file_hash,
            previous_hash,
            timestamp
        )

        ledger_entry = Ledger(
            document_id=document.id,
            action="REJECT",
            hash=block_hash,
            previous_hash=previous_hash,
            performed_by=current_user.id,
            timestamp=timestamp
        )

        db.add(ledger_entry)
        db.commit()

        return {
            "message": "Document rejected successfully",
            "block_hash": block_hash
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        db.close()

@app.get("/document/{document_id}/validate-chain")
def validate_chain(
    document_id: int,
    current_user = Depends(require_roles(["admin", "bank", "auditor"]))
):
    db = SessionLocal()

    try:
        entries = db.query(Ledger).filter(
            Ledger.document_id == document_id
        ).order_by(Ledger.id.asc()).all()

        if not entries:
            raise HTTPException(status_code=404, detail="No ledger entries found")

        for i in range(len(entries)):
            entry = entries[i]

            # Recompute block hash
            recalculated_hash = generate_block_hash(
                entry.document_id,
                entry.action,
                db.query(Document).filter(Document.id == entry.document_id).first().file_hash,
                entry.previous_hash,
                entry.timestamp
            )

            if entry.hash != recalculated_hash:
                return {
                    "status": "CHAIN BROKEN",
                    "reason": f"Block {entry.id} hash mismatch"
                }

            if i > 0 and entry.previous_hash != entries[i-1].hash:
                return {
                    "status": "CHAIN BROKEN",
                    "reason": "Previous hash mismatch"
                }

        return {"status": "CHAIN VALID"}

    finally:
        db.close()