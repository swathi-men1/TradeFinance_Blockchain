from fastapi import APIRouter, Depends
from app.roles import require_role
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/dashboard")
def admin_dashboard(
    current_user: User = Depends(require_role("admin"))
):
    return {
        "message": "Welcome Admin",
        "email": current_user.email
    }
