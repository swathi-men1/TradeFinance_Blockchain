from fastapi import FastAPI
from app.database import engine, Base
from app.models.user import User
from app.routes import auth
from app.routes import protected


app = FastAPI(
    title="ChainDocs – Trade Finance Blockchain Explorer",
    version="0.1.0"
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Register authentication routes
app.include_router(auth.router)
app.include_router(protected.router)

@app.get("/")
def health_check():
    return {"status": "Backend is running successfully"}
