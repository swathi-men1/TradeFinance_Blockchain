from fastapi import FastAPI
from database import Base, engine

from routes.auth import router as auth_router
from routes.documents import router as documents_router
from routes.ledger import router as ledger_router
from routes.trades import router as trades_router
from routes.analytics import router as analytics_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Trade Finance Blockchain Explorer")

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(documents_router, prefix="/documents", tags=["Documents"])
app.include_router(ledger_router, prefix="/ledger", tags=["Ledger"])
app.include_router(trades_router, prefix="/trades", tags=["Trades"])
app.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])

@app.get("/")
def home():
    return {"message": "Backend running successfully"}
