from fastapi import APIRouter
from app.services.analytics_service import overview

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview")
def analytics_overview():
    return overview()
