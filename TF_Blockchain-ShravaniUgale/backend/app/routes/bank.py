from fastapi import APIRouter, Depends
from app.roles import require_role
from app.models.user import User

router = APIRouter(prefix="/bank", tags=["Bank"])

@router.get("/dashboard")
def bank_dashboard(
    current_user: User = Depends(require_role("bank"))
):
    return {
        "message": "Welcome Bank User",
        "email": current_user.email
    }
