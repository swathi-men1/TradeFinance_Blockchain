from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.integrity_check import check_document_integrity

router = APIRouter(
    prefix="/integrity",
    tags=["Integrity"]
)

@router.get("/check")
def run_integrity_check(db: Session = Depends(get_db)):
    alerts = check_document_integrity(db)

    return {
        "status": "completed",
        "alerts_found": len(alerts),
        "alerts": alerts
    }
