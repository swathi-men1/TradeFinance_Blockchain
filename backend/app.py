from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from database.init_db import init_db
from routes.auth import router as auth_router
from routes.documents import router as documents_router
from routes.ledger import router as ledger_router
from routes.analytics import router as analytics_router

app = FastAPI(title="TradeChain API")

# --------------------------------------------------
# MIDDLEWARE
# --------------------------------------------------
from fastapi.middleware.cors import CORSMiddleware

# Session must be INSIDE CORS so CORS can handle the preflights
app.add_middleware(
    SessionMiddleware,
    secret_key="tradechain-secret-key-v3",
    session_cookie="tradechain_session",
    same_site="lax",
    https_only=False
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
        "http://localhost:5501",
        "http://127.0.0.1:5501",
        "null"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# STARTUP
# --------------------------------------------------
@app.on_event("startup")
def startup():
    init_db()

# --------------------------------------------------
# ROUTES
# --------------------------------------------------
@app.get("/")
def read_root():
    return {
        "message": "Welcome to TradeChain API",
        "status": "Running",
        "documentation": "/docs"
    }


from routes.analytics import router as analytics_router
from routes.transactions import router as transactions_router

app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(ledger_router)
app.include_router(analytics_router)
app.include_router(transactions_router)

# --------------------------------------------------
# STATIC FILES (Frontend)
# --------------------------------------------------
import os
from fastapi.staticfiles import StaticFiles

# Resolve path to frontend relative to this file
base_dir = os.path.dirname(os.path.abspath(__file__))
frontend_dir = os.path.join(base_dir, "../frontend")

# Check if dir exists to avoid errors
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
else:
    print(f"WARNING: Frontend directory not found at {frontend_dir}")
