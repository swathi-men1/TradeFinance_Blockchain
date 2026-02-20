from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
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
# ROOT API CHECK
# -------------------------
@app.get("/api")
def api_root():
    return {"status": "ok"}


# -------------------------
# SERVE REACT BUILD (FIXED)
# -------------------------

# absolute path (IMPORTANT FIX)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
FRONTEND_DIR = os.path.join(os.getcwd(), "client", "dist")

if os.path.exists(FRONTEND_DIR):

    # serve assets
    app.mount("/assets",
              StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")),
              name="assets")

    # serve static files like vite.svg
    app.mount(
        "/",
        StaticFiles(directory=FRONTEND_DIR, html=True),
        name="static",
    )

    # fallback for React routes
    @app.get("/", include_in_schema=False)
    async def serve_root():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

    # React routing
    @app.get("/{path:path}", include_in_schema=False)
    async def serve_react(path: str):
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
