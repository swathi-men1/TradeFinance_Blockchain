from fastapi import FastAPI
from app.routes import trades, documents, ledger

app = FastAPI(title="Trade Finance Blockchain Explorer")

app.include_router(trades.router, prefix="/trades", tags=["Trades"])
app.include_router(documents.router, prefix="/documents", tags=["Documents"])
app.include_router(ledger.router, prefix="/ledger", tags=["Ledger"])

@app.get("/")
def root():
    return {"message": "API is running"}
