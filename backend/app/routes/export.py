from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
import csv
import io

from app.database import get_db
from app.models.document import Document
from app.models.user import User
from app.dependencies.auth import get_current_user

router = APIRouter(
    prefix="/export",
    tags=["Export"]
)


@router.get("/documents/csv")
def export_documents_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export all documents as CSV.
    Only BANK, ADMIN, AUDITOR allowed.
    """

    # 🔐 Role-based Authorization
    if current_user.role.upper() not in ["BANK", "ADMIN", "AUDITOR"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    output = io.StringIO()
    writer = csv.writer(output)

    # Header Row
    writer.writerow([
        "Document ID",
        "Organization ID",
        "Original Filename",
        "Document Type",
        "SHA256 Hash",
        "Status",
        "Uploaded By",
        "Created At"
    ])

    documents = db.query(Document).all()

    for doc in documents:
        writer.writerow([
            str(doc.id),
            doc.org_id,
            doc.original_filename,
            doc.document_type,
            doc.sha256_hash,
            doc.status,
            doc.uploaded_by,
            doc.created_at
        ])

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=documents_export.csv"
        }
    )
