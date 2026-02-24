from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from utils.auth_dependencies import get_db, require_role
from services.analytics_service import generate_analytics

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/")
@router.get("/stats")
def analytics(
    db: Session = Depends(get_db),
    user=Depends(require_role(["admin"]))
):
    return generate_analytics(db)
