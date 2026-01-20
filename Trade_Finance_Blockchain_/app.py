from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse

from starlette.middleware.sessions import SessionMiddleware

from database.init_db import init_db, SessionLocal
from models.ledger_entry import LedgerEntry
from services.analytics_service import generate_analytics

# --------------------------------------------------
# ROUTERS (CORRECT WAY)
# --------------------------------------------------
from routes import (
    user_router,
    documents_router,
    ledger_router,
    transactions_router,
    risk_router,
    analytics_router
)
from routes import dashboard as dashboard_api  # API dashboard only

# --------------------------------------------------
# App initialization
# --------------------------------------------------
app = FastAPI(title="TradeChain – Trade Finance Blockchain Explorer")

# --------------------------------------------------
# SESSION MIDDLEWARE
# --------------------------------------------------
app.add_middleware(
    SessionMiddleware,
    secret_key="tradechain-secret-key-123"
)

# --------------------------------------------------
# Startup event
# --------------------------------------------------
@app.on_event("startup")
def on_startup():
    init_db()

# --------------------------------------------------
# Static files & templates
# --------------------------------------------------
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# --------------------------------------------------
# ROOT → FORCE LOGIN FIRST
# --------------------------------------------------
@app.get("/")
def root():
    return RedirectResponse(url="/auth/login")

# --------------------------------------------------
# AUTH ROUTES
# --------------------------------------------------
app.include_router(user_router)   # /auth/signup , /auth/login , /auth/logout

# --------------------------------------------------
# DASHBOARD UI
# --------------------------------------------------
@app.get("/dashboard")
def dashboard_ui(request: Request):
    user_data = request.session.get("user")

    if not user_data:
        return RedirectResponse("/auth/login", status_code=303)

    db = SessionLocal()

    try:
        # ---------- SAFE ANALYTICS ----------
        analytics_data = {
            "documents_by_type": {},
            "trades_by_status": {},
            "risk_distribution": {},
            "ledger_activity_count": 0
        }

        try:
            data = generate_analytics(db)
            if isinstance(data, dict):
                analytics_data.update(data)
        except Exception as e:
            print("ANALYTICS ERROR:", e)

        # ---------- METRICS ----------
        total_documents = sum(
            analytics_data.get("documents_by_type", {}).values()
        )

        active_transactions = (
            analytics_data
            .get("trades_by_status", {})
            .get("in_progress", 0)
        )

        verified_today = analytics_data.get("ledger_activity_count", 0)
        avg_risk_score = "Auto"

        # ---------- LEDGER ----------
        recent_ledger = []
        try:
            ledger_entries = (
                db.query(LedgerEntry)
                .order_by(LedgerEntry.timestamp.desc())
                .limit(5)
                .all()
            )

            for entry in ledger_entries:
                recent_ledger.append({
                    "document_id": entry.document_id,
                    "action": entry.action,
                    "actor": entry.actor_role,
                    "timestamp": entry.timestamp
                })
        except Exception as e:
            print("LEDGER ERROR:", e)

        # ---------- RENDER ----------
        return templates.TemplateResponse(
            "dashboard.html",
            {
                "request": request,
                "total_documents": total_documents,
                "active_transactions": active_transactions,
                "verified_today": verified_today,
                "avg_risk_score": avg_risk_score,
                "recent_ledger": recent_ledger,
                "analytics": analytics_data,

                # USER DATA
                "user_name": user_data.get("name"),
                "user_email": user_data.get("email"),
                "user_role": user_data.get("role"),
                "user_org": user_data.get("org")
            }
        )

    finally:
        db.close()

# --------------------------------------------------
# MODULE ROUTES (CORRECT)
# --------------------------------------------------
app.include_router(documents_router)     # /documents/*
app.include_router(ledger_router)        # /ledger/*
app.include_router(transactions_router)  # /transactions/*
app.include_router(risk_router)          # /risk/*
app.include_router(analytics_router)     # /analytics/*

