from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
import hashlib
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
class User(BaseModel):
    username: str
    password: str

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
# Risk Calculation
# --------------------------------------------------
def calculate_risk(db: Session, trade_id: int):
    score = 10

    doc_count = db.query(DocumentDB).filter(
        DocumentDB.trade_id == trade_id
    ).count()

    if doc_count > 0:
        score += 20

    tamper_count = db.query(LedgerDB).filter(
        LedgerDB.action == "TAMPER_DETECTED",
        LedgerDB.details.contains(str(trade_id))
    ).count()

    score += tamper_count * 40

    if score < 30:
        level = "LOW"
    elif score < 60:
        level = "MEDIUM"
    else:
        level = "HIGH"

    return score, level

# --------------------------------------------------
# Routes
# --------------------------------------------------
@app.get("/")
def home():
    return {"message": "ChainDocs backend running"}

# ---------------- AUTH ----------------


class SignupRequest(BaseModel):
    username: str
    password: str

@app.post("/signup")
def signup(user: SignupRequest, db: Session = Depends(get_db)):

    existing = db.query(UserDB).filter(
        UserDB.username == user.username
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    db_user = UserDB(
        username=user.username.strip(),
        password=user.password.strip(),
        role="user",          # ✅ DEFAULT ROLE (FIX)
        active=False
    )

    db.add(db_user)
    db.commit()

    return {"message": "Signup successful"}

@app.post("/login")
def login(user: User, db: Session = Depends(get_db)):
    username = user.username.strip()
    password = user.password.strip()

    db_user = db.query(UserDB).filter(
        UserDB.username == username,
        UserDB.password == password
    ).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    db_user.active = True
    db.commit()

    add_ledger(db, "LOGIN", f"User {username} logged in")
    add_block(db, f"User {username} logged in")

    return {"message": "Login successful"}

# ---------------- TRADES ----------------
@app.post("/trade")
def create_trade(trade: Trade, db: Session = Depends(get_db)):
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

    add_ledger(db, "CREATE_TRADE", f"Trade {db_trade.id} created")
    add_block(db, f"Trade {db_trade.id} created")

    return {"trade_id": db_trade.id}

@app.get("/trades")
def get_trades(db: Session = Depends(get_db)):
    trades = db.query(TradeDB).order_by(
        TradeDB.created_at.desc()
    ).all()

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

# ---------------- RISK SCORES ----------------
@app.get("/risks")
def get_risks(db: Session = Depends(get_db)):
    risks = db.query(RiskScoreDB).all()
    return [
        {
            "trade_id": r.trade_id,
            "risk_score": r.risk_score,
            "risk_level": r.risk_level
        }
        for r in risks
    ]

# ---------------- DOCUMENT UPLOAD ----------------
@app.post("/upload-document")
async def upload_document(
    trade_id: int = Form(...),
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # 1️⃣ Check trade exists
    trade = db.query(TradeDB).filter(TradeDB.id == trade_id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    # 2️⃣ Read file & generate hash
    file_bytes = await file.read()
    file_hash = generate_hash(file_bytes)

    # 3️⃣ Check SAME trade + SAME document type
    existing_doc = db.query(DocumentDB).filter(
        DocumentDB.trade_id == trade_id,
        DocumentDB.doc_type == doc_type
    ).first()

    # 4️⃣ Tamper logic
    if existing_doc:
        if existing_doc.hash != file_hash:
            # 🚨 TAMPER detected
            existing_doc.hash = file_hash

            add_ledger(
                db,
                "TAMPER_DETECTED",
                f"{doc_type} tampered for Trade {trade_id}"
            )

            add_block(
                db,
                f"{doc_type} tampered for Trade {trade_id}"
            )
    else:
        # ✅ First-time upload
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

        add_block(
            db,
            f"{doc_type} uploaded for Trade {trade_id}"
        )

    # 5️⃣ Update trade status
    trade.status = "Uploaded"
    db.commit()

    # 6️⃣ Risk calculation
    score, level = calculate_risk(db, trade_id)

    risk = db.query(RiskScoreDB).filter(
        RiskScoreDB.trade_id == trade_id
    ).first()

    if risk:
        risk.risk_score = score
        risk.risk_level = level
        risk.updated_at = datetime.utcnow()
    else:
        db.add(
            RiskScoreDB(
                trade_id=trade_id,
                username="demo_user",
                risk_score=score,
                risk_level=level
            )
        )

    db.commit()

    # 7️⃣ RETURN hash to UI (IMPORTANT)
    return {
        "message": "Document processed successfully",
        "hash": file_hash,
        "risk_score": score,
        "risk_level": level
    }



@app.get("/verify-document/{trade_id}")
def verify_document(trade_id: int, db: Session = Depends(get_db)):

    # 1️⃣ Fetch document
    document = db.query(DocumentDB).filter(DocumentDB.trade_id == trade_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # 2️⃣ Recalculate hash (simulated – same logic as upload)
    recalculated_hash = hashlib.sha256(
        (str(trade_id) + document.doc_type).encode()
    ).hexdigest()

    # 3️⃣ Compare hashes
    if recalculated_hash == document.hash:
        status = "VERIFIED"

        # Ledger entry
        ledger = LedgerDB(
            action="VERIFY_SUCCESS",
            details=f"Document verified for Trade ID {trade_id}",
            timestamp=datetime.utcnow()
        )
        db.add(ledger)

        # Blockchain block
        add_block(
            db,
            f"Document verified for Trade ID {trade_id}"
        )

    else:
        status = "TAMPERED"

        # Ledger entry
        ledger = LedgerDB(
            action="TAMPER_DETECTED",
            details=f"Document tampered for Trade ID {trade_id}",
            timestamp=datetime.utcnow()
        )
        db.add(ledger)

        # Increase risk score
        risk = db.query(RiskScoreDB).filter(
            RiskScoreDB.trade_id == trade_id
        ).first()

        if risk:
            risk.risk_score += 20
            risk.risk_level = "HIGH"
            risk.updated_at = datetime.utcnow()

        # Blockchain block
        add_block(
            db,
            f"TAMPER detected for Trade ID {trade_id}"
        )

    db.commit()

    return {
        "trade_id": trade_id,
        "status": status
    }

# ---------------- LEDGER ----------------
@app.get("/ledger")
def view_ledger(db: Session = Depends(get_db)):
    return db.query(LedgerDB).order_by(
        LedgerDB.id.desc()
    ).all()

# ---------------- ANALYTICS ----------------
@app.get("/analytics")
def analytics(db: Session = Depends(get_db)):
    return {
        "active_users": db.query(UserDB).filter(UserDB.active == True).count(),
        "tamper_attempts": db.query(LedgerDB)
            .filter(LedgerDB.action == "TAMPER_DETECTED")
            .count()
    }

# ---------------- BLOCKCHAIN VIEW ----------------
@app.get("/blocks")
def view_blocks(db: Session = Depends(get_db)):
    return db.query(BlockDB).order_by(
        BlockDB.index.desc()
    ).all()
