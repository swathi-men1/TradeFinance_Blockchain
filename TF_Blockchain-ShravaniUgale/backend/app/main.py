from fastapi import FastAPI
from app.database import engine, Base
from app.models.user import User
from app.routes import auth
from app.routes import protected
from app.routes import admin, bank
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, documents



app = FastAPI(
    title="ChainDocs – Trade Finance Blockchain Explorer",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow frontend access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Register authentication routes
app.include_router(auth.router)
app.include_router(protected.router)
app.include_router(admin.router)
app.include_router(bank.router)
app.include_router(documents.router)
app.include_router(auth.router)


@app.get("/")
def health_check():
    return {"status": "Backend is running successfully"}

from fastapi import Request

@app.get("/debug/token")
def debug_token_route(request: Request):
    return {
        "authorization": request.headers.get("authorization")
    }
