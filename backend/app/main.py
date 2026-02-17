from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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
# CORS CONFIG
# -------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# LEDGER INTEGRITY CHECK JOB
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

    except Exception:
        pass

    finally:
        db.close()


# -------------------------
# STARTUP
# -------------------------


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

    scheduler = BackgroundScheduler()
    scheduler.add_job(verify_ledger_integrity, "interval", minutes=5)
    scheduler.start()


# -------------------------
# API ROUTERS
# -------------------------

app.include_router(auth_routes.router)
app.include_router(document_routes.router)
app.include_router(ledger_routes.router)
app.include_router(transaction_routes.router)
app.include_router(analytics_routes.router)

# -------------------------
# SERVE REACT BUILD
# -------------------------

FRONTEND_DIR = "/home/runner/workspace/client/dist"

if os.path.exists(FRONTEND_DIR):

    # Serve static assets
    app.mount(
        "/assets",
        StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")),
        name="assets",
    )

    # Serve React root
    @app.get("/")
    async def serve_root():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

    # Serve React for all other routes
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
