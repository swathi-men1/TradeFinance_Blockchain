from fastapi import FastAPI

from app.routes import auth, documents, trades, ledger

# --------------------------------------------------
# Create FastAPI app
# --------------------------------------------------

app = FastAPI(
    title="Trade Finance Blockchain API",
    version="0.1.0",
    description="Backend API for Trade Finance Blockchain system"
)

# --------------------------------------------------
# Register Routers
# (PREFIXES ARE DEFINED INSIDE ROUTE FILES)
# --------------------------------------------------

app.include_router(auth.router)        # /auth/*
app.include_router(documents.router)   # /documents/*
app.include_router(trades.router)       # /trades/*
app.include_router(ledger.router)       # /ledger/*

# --------------------------------------------------
# Root Endpoint
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "status": "Trade Finance Blockchain API running"
    }
