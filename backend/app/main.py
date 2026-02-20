from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import (
    auth,
    documents,
    trades,
    ledger,
    risk,
    analytics
)

app = FastAPI(title="Trade Finance Blockchain API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers (ONLY ONCE EACH)
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(trades.router)
app.include_router(ledger.router)
app.include_router(risk.router)
app.include_router(analytics.router)


@app.get("/")
def root():
    return {"status": "API running"}
