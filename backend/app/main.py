from fastapi import FastAPI

from app.database import engine, Base

# -------------------- IMPORT MODELS --------------------
# Importing models ensures SQLAlchemy registers tables
from app.models import (
    user,
    organization,
    document,
    ledger,
    trade_transaction,
    risk_score
)

# -------------------- IMPORT ROUTERS --------------------
from app.routes.auth import router as auth_router
from app.routes.organization import router as org_router
from app.routes.documents import router as documents_router
from app.routes.trades import router as trade_router
from app.routes.integrity import router as integrity_router
from app.routes.risk import router as risk_router

# -------------------- CREATE APP --------------------
app = FastAPI(title="Trade Finance Blockchain Explorer")

# -------------------- CREATE TABLES --------------------
Base.metadata.create_all(bind=engine)

# -------------------- REGISTER ROUTERS --------------------
app.include_router(auth_router)
app.include_router(org_router)
app.include_router(documents_router)
app.include_router(trade_router)
app.include_router(integrity_router)
app.include_router(risk_router)

# -------------------- ROOT --------------------
@app.get("/")
def root():
    return {"status": "Backend running successfully"}

# -------------------- DB CHECK --------------------
@app.get("/db-check")
def db_check():
    try:
        engine.connect()
        return {"db": "connected"}
    except Exception:
        return {"db": "error"}
