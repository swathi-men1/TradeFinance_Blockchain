from fastapi import FastAPI
from app.database import engine, Base
from app.models.user import User

app = FastAPI(
    title="ChainDocs – Trade Finance Blockchain Explorer",
    version="0.1.0"
)

Base.metadata.create_all(bind=engine)


@app.get("/")
def health_check():
    return {"status": "Backend is running successfully"}
