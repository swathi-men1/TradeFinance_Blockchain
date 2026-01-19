from fastapi import FastAPI

from app.database import engine, Base
from app.models import user, organization
from app.routes import auth, organization as organization_routes

app = FastAPI(title="Trade Finance Blockchain Explorer")

# Create database tables (users, organizations)
Base.metadata.create_all(bind=engine)

# Include routers
app.include_router(auth.router)
app.include_router(organization_routes.router)


@app.get("/")
def root():
    return {"status": "Backend running successfully"}


@app.get("/db-check")
def db_check():
    try:
        engine.connect()
        return {"db": "connected"}
    except Exception:
        return {"db": "error"}
