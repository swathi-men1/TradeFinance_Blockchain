from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
import hashlib
from fastapi import Request
from database import SessionLocal, engine, Base
from models import (
    UserDB,
    TradeDB,
    DocumentDB,
    LedgerDB,
    RiskScoreDB,
    BlockDB
)

# --------------------------------------------------
# Create tables
# --------------------------------------------------
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ChainDocs Backend")

# --------------------------------------------------
# CORS
# --------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# DB Dependency
# --------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --------------------------------------------------
# Schemas
# --------------------------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str

class SignupRequest(BaseModel):
    username: str
    password: str
    role: str

class Trade(BaseModel):
    seller: str
    product: str
    quantity: int
    price: float

# --------------------------------------------------
# Utils
# --------------------------------------------------
def generate_hash(data: bytes):
    return hashlib.sha256(data).hexdigest()

def add_ledger(db: Session, action: str, details: str):
    db.add(
        LedgerDB(
            action=action,
            details=details,
            timestamp=datetime.utcnow()
        )
    )
    db.commit()

def get_active_user(db: Session):
    return db.query(UserDB).filter(UserDB.active == True).first()

# --------------------------------------------------
# BLOCKCHAIN UTILS
# --------------------------------------------------
def create_block_hash(index, timestamp, data, previous_hash):
    raw = f"{index}{timestamp}{data}{previous_hash}"
    return hashlib.sha256(raw.encode()).hexdigest()

def add_block(db: Session, data: str):
    last_block = db.query(BlockDB).order_by(BlockDB.id.desc()).first()

    if last_block:
        index = last_block.index + 1
        previous_hash = last_block.hash
    else:
        index = 1
        previous_hash = "0"

    timestamp = datetime.utcnow()
    block_hash = create_block_hash(index, timestamp, data, previous_hash)

    block = BlockDB(
        index=index,
        timestamp=timestamp,
        data=data,
        previous_hash=previous_hash,
        hash=block_hash
    )

    db.add(block)
    db.commit()

# --------------------------------------------------
# HOME
# --------------------------------------------------
@app.get("/")
def home():
    return {"message": "ChainDocs backend running"}

# --------------------------------------------------
# AUTH
# --------------------------------------------------
@app.post("/signup")
def signup(user: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(UserDB).filter(
        UserDB.username == user.username
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    # 🔐 hash password
    hashed_password = hashlib.sha256(user.password.encode()).hexdigest()

    db_user = UserDB(
        username=user.username.strip(),
        password=hashed_password,   # ✅ FIXED
        role="pending",             # ✅ as per mam
        active=False
    )

    db.add(db_user)
    db.commit()

    return {
        "message": "Signup successful. Waiting for admin approval."
    }

@app.post("/login")
def login(user: LoginRequest, db: Session = Depends(get_db)):
    username = user.username.strip()
    password = user.password.strip()

    # 🔐 hash password (must match signup)
    hashed_password = hashlib.sha256(password.encode()).hexdigest()

    db_user = db.query(UserDB).filter(
        UserDB.username == username,
        UserDB.password == hashed_password
    ).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # ⛔ BLOCK users until admin assigns role (ADMIN CAN ALWAYS LOGIN)
    if db_user.role == "pending" and db_user.username != "admin":
     raise HTTPException(
        status_code=403,
        detail="Your account is pending admin approval"
    )

    # ✅ mark active
    db_user.active = True
    db.commit()

    # ✅ logs (UNCHANGED)
    add_ledger(db, "LOGIN", f"User {username} logged in")
    add_block(db, f"User {username} logged in")

    return {
        "message": "Login successful",
        "username": db_user.username,
        "role": db_user.role
    }

@app.post("/logout-all")
def logout_all(db: Session = Depends(get_db)):
    db.query(UserDB).update({UserDB.active: False})
    db.commit()
    return {"message": "All users logged out"}

# --------------------------------------------------
# TRADES
# --------------------------------------------------


@app.post("/trade")
def create_trade(
    trade: Trade,
    request: Request,
    db: Session = Depends(get_db)
):
    x_user = request.headers.get("X-User")

    if not x_user:
        raise HTTPException(status_code=401, detail="User not identified")

    user = db.query(UserDB).filter(
        UserDB.username == x_user
    ).first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if user.role != "bank":
        raise HTTPException(status_code=403, detail="Only Bank users can create trades")

    db_trade = TradeDB(
        seller=trade.seller,
        product=trade.product,
        quantity=trade.quantity,
        price=trade.price,
        status="Pending",
        created_at=datetime.utcnow()
    )

    db.add(db_trade)
    db.commit()
    db.refresh(db_trade)

    add_ledger(db, "CREATE_TRADE", f"Trade {db_trade.id} created by {user.username}")
    add_block(db, f"Trade {db_trade.id} created by {user.username}")

    return {"trade_id": db_trade.id}
@app.get("/trades")
def get_trades(db: Session = Depends(get_db)):
    trades = db.query(TradeDB).order_by(TradeDB.created_at.desc()).all()

    return [
        {
            "trade_id": t.id,
            "seller": t.seller,
            "product": t.product,
            "quantity": t.quantity,
            "price": t.price,
            "status": t.status,
            "created_at": t.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
        for t in trades
    ]

# --------------------------------------------------
# DOCUMENT UPLOAD (CORPORATE USERS)
# --------------------------------------------------
@app.post("/upload-document")
async def upload_document(
    trade_id: int = Form(...),
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    x_user: str = Header(None),
    db: Session = Depends(get_db)
):
    if not x_user:
        raise HTTPException(status_code=401, detail="User not identified")

    user = db.query(UserDB).filter(
        UserDB.username == x_user,
        UserDB.active == True
    ).first()

    if not user:
        raise HTTPException(status_code=401, detail="Login required")

    if user.role != "corporate":
        raise HTTPException(
            status_code=403,
            detail="Only Corporate users can upload documents"
        )

    trade = db.query(TradeDB).filter(TradeDB.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    # 🔑 Read file + hash
    file_bytes = await file.read()
    file_hash = generate_hash(file_bytes)

    # 🔍 Check if SAME document type already exists
    existing_doc = db.query(DocumentDB).filter(
        DocumentDB.trade_id == trade_id,
        DocumentDB.doc_type == doc_type
    ).first()

    if existing_doc:
        # 🔁 Re-upload of same document type
        if existing_doc.hash != file_hash:
            # ❌ TAMPER DETECTED
            existing_doc.hash = file_hash

            add_ledger(
                db,
                "TAMPER_DETECTED",
                f"{doc_type} tampered for Trade {trade_id} by {user.username}"
            )
            add_block(db, f"{doc_type} tampered for Trade {trade_id}")

            status = "TAMPERED"
        else:
            status = "VERIFIED"
    else:
        # ✅ FIRST TIME upload
        new_doc = DocumentDB(
            trade_id=trade_id,
            doc_type=doc_type,
            hash=file_hash
        )
        db.add(new_doc)

        add_ledger(
            db,
            "UPLOAD_DOCUMENT",
            f"{doc_type} uploaded for Trade {trade_id}"
        )
        add_block(db, f"{doc_type} uploaded for Trade {trade_id}")

        status = "VERIFIED"

    trade.status = "Uploaded"
    db.commit()

    return {
        "message": "Document processed successfully",
        "hash": file_hash,
        "status": status
    }
# --------------------------------------------------
# VERIFY DOCUMENT
# --------------------------------------------------
@app.get("/verify-document/{trade_id}")
def verify_document(trade_id: int, db: Session = Depends(get_db)):

    # 1️⃣ Ensure trade exists
    trade = db.query(TradeDB).filter(TradeDB.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    # 2️⃣ Ensure documents exist
    documents = db.query(DocumentDB).filter(
        DocumentDB.trade_id == trade_id
    ).all()

    if not documents:
        raise HTTPException(status_code=404, detail="No documents uploaded for this trade")

    # 3️⃣ Check if ANY tamper event already recorded for this trade
    tamper_event = db.query(LedgerDB).filter(
        LedgerDB.action == "TAMPER_DETECTED",
        LedgerDB.details.contains(f"Trade {trade_id}")
    ).first()

    # 4️⃣ Decide status (READ-ONLY)
    if tamper_event:
        status = "TAMPERED"
    else:
        status = "VERIFIED"

    # ✅ DO NOT create new ledger entries here
    # ✅ Verification is only reporting status

    return {
        "trade_id": trade_id,
        "documents_uploaded": len(documents),
        "status": status
    }
# --------------------------------------------------
# RISK CALCULATION (CORPORATE)
# --------------------------------------------------
@app.post("/calculate-risk")
def calculate_risk(
    x_user: str = Header(None),
    db: Session = Depends(get_db)
):
    if not x_user:
        raise HTTPException(status_code=401, detail="User not identified")

    user = db.query(UserDB).filter(
        UserDB.username == x_user,
        UserDB.active == True
    ).first()

    if not user or user.role != "corporate":
        raise HTTPException(status_code=403, detail="Corporate users only")

    #  Count ONLY tamper events related to this corporate user
    tamper_count = db.query(LedgerDB).filter(
        LedgerDB.action == "TAMPER_DETECTED",
        LedgerDB.details.contains(user.username)
    ).count()

    # Count ONLY trades created by this corporate
    trade_count = db.query(TradeDB).filter(
        TradeDB.seller == user.username
    ).count()

    # Base risk is low (10)
    risk_score = 10 + (tamper_count * 30) + (trade_count * 5)
    risk_score = min(risk_score, 100)
    # ✅ Risk classification (NEW)
    if risk_score < 40:
        risk_level = "LOW"
    elif risk_score < 70:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"

    return {
        "corporate_user": user.username,
        "risk_score": risk_score,
        "risk_level":risk_level
    }
# --------------------------------------------------
# LEDGER
# --------------------------------------------------
@app.get("/ledger")
def get_ledger(db: Session = Depends(get_db)):
    logs = db.query(LedgerDB).all()
    return [
        {
            "action": l.action,
            "details": l.details,
            "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S") if l.timestamp else "-"
        }
        for l in logs
    ]

# --------------------------------------------------
# USERS
# --------------------------------------------------
@app.get("/all-users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(UserDB).all()
    return [{"username": u.username, "role": u.role} for u in users]

# --------------------------------------------------
# ANALYTICS
# --------------------------------------------------
@app.get("/analytics")
def analytics(db: Session = Depends(get_db)):
    return {
        "active_users": db.query(UserDB).filter(UserDB.active == True).count(),
        "tamper_attempts": db.query(LedgerDB)
            .filter(LedgerDB.action == "TAMPER_DETECTED")
            .count()
    }

# --------------------------------------------------
# BLOCKCHAIN VIEW
# --------------------------------------------------
@app.get("/blocks")
def view_blocks(db: Session = Depends(get_db)):
    return db.query(BlockDB).order_by(BlockDB.index.desc()).all()

@app.get("/admin/pending-users")
def get_pending_users(db: Session = Depends(get_db)):
    users = db.query(UserDB).filter(
        UserDB.role == "pending"
    ).all()

    return [
        {
            "id": u.id,
            "username": u.username
        } for u in users
    ]


class ApproveUserRequest(BaseModel):
    user_id: int
    role: str


@app.post("/admin/approve-user")
def approve_user(req: ApproveUserRequest, db: Session = Depends(get_db)):

    if req.role not in ["bank", "corporate", "auditor"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    user = db.query(UserDB).filter(UserDB.id == req.user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = req.role
    user.active = True
    db.commit()

    add_ledger(db, "ADMIN_APPROVAL", f"User {user.username} approved as {req.role}")
    add_block(db, f"User {user.username} approved as {req.role}")

    return {"message": "User approved successfully"}