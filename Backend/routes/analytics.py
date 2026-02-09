from fastapi import APIRouter

router = APIRouter()

@router.get("/summary")
def analytics_summary():
    return {"analytics": "summary data"}
