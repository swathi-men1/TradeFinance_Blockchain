from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
import hashlib
import os

from .database import engine, SessionLocal
from .models import Base, LedgerEntry
from .routes import (
    auth_routes,
    document_routes,
    ledger_routes,
    transaction_routes,
    analytics_routes,
)
from .utils import log_action

app = FastAPI(title="Trade Finance Blockchain Explorer")

# -------------------------
# CORS
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------
# INTEGRITY JOB
# -------------------------
def verify_ledger_integrity():
    db: Session = SessionLocal()
    try:
        entries = db.query(LedgerEntry).order_by(
            LedgerEntry.created_at.asc()).all()

        previous_hash = "GENESIS"

        for entry in entries:
            recalculated_string = (f"{entry.document_id}"
                                   f"{entry.actor_id}"
                                   f"{previous_hash}"
                                   f"{entry.created_at}")

            recalculated_hash = hashlib.sha256(
                recalculated_string.encode()).hexdigest()

            if entry.current_hash != recalculated_hash:
                log_action(
                    db=db,
                    user_id=entry.actor_id,
                    action_type="INTEGRITY_ALERT",
                    entity_type="LEDGER",
                    entity_id=entry.id,
                    description="Ledger integrity mismatch detected",
                )
                break

            previous_hash = entry.current_hash

    finally:
        db.close()


# -------------------------
# STARTUP
# -------------------------
@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


# -------------------------
# INCLUDE API ROUTES
# -------------------------
app.include_router(auth_routes.router, prefix="/api")
app.include_router(document_routes.router, prefix="/api")
app.include_router(ledger_routes.router, prefix="/api")
app.include_router(transaction_routes.router, prefix="/api")
app.include_router(analytics_routes.router, prefix="/api")

# -------------------------
# SERVE REACT BUILD
# -------------------------
FRONTEND_DIR = "client/dist"

if os.path.exists(FRONTEND_DIR):

    app.mount(
        "/assets",
        StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")),
        name="assets",
    )

    @app.get("/")
    async def serve_root():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
