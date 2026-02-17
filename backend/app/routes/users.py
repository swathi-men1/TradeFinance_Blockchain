from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User

router = APIRouter(
    prefix="",
    tags=["Users"]
)


# ============================================================
# LIST ALL USERS (FOR SELLER SELECTION)
# ============================================================
@router.get("/users")
def list_users(
    db: Session = Depends(get_db)
):
    """
    Public endpoint: List all users (for trading counterpart selection).
    Returns: List of users with basic info (id, email, org_id)
    """
    users = db.query(User).all()
    return [
        {
            "id": user.id,
            "email": user.email,
            "org_id": user.org_id,
            "role": user.role.lower(),
        }
        for user in users
    ]
