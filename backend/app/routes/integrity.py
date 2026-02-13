from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.integrity_service import check_document_integrity
from app.utils.auth import get_current_user

router = APIRouter(
    prefix="/integrity",
    tags=["Integrity"]
)


@router.get("/check")
def run_integrity_check(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    if current_user.role.upper() not in ["BANK", "ADMIN", "AUDITOR"]:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to run integrity check"
        )

    result = check_document_integrity(db, actor=current_user)

    return result
