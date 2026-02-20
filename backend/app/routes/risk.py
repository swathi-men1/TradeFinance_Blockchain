from fastapi import APIRouter
from app.services.risk_service import calculate_user_risk

router = APIRouter(prefix="/risk", tags=["Risk"])

@router.get("/user/{username}")
def get_user_risk(username: str):
    """
    Calculates risk for a Corporate User (Buyer/Seller)
    """
    return calculate_user_risk(username)
