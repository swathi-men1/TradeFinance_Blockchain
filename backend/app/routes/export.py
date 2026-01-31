from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
import csv
import io

from app.database import get_db
from app.models.document import Document

router = APIRouter(
    prefix="/export",
    tags=["Export"]
)

@router.get("/documents/csv")
def export_documents_csv(db: Session = Depends(get_db)):
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Document ID",
        "Org ID",
        "SHA256 Hash",
        "Uploaded At"
    ])

    docs = db.query(Document).all()
    for d in docs:
        writer.writerow([
            d.id,
            d.org_id,
            d.sha256_hash,
            d.created_at
        ])

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=documents.csv"}
    )
