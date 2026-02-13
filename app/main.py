from fastapi import FastAPI

from app.routes import (
    auth,
    documents,
    trades,
    ledger,
    risk,
    analytics
)

app = FastAPI(title="Trade Finance Blockchain API")


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
