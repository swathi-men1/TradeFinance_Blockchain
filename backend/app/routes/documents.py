import uuid
from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.minio_client import s3_client, BUCKET_NAME
from app.utils.hash_utils import compute_sha256
from app.models.document import Document
from app.models.ledger import LedgerEntry
from app.utils.ledger_utils import compute_ledger_hash
from app.utils.auth import get_current_user

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # ✅ IDs from JWT (INTEGER)
    org_id = int(current_user["org_id"])
    uploaded_by = int(current_user["user_id"])

    # 1️⃣ Read file
    content = await file.read()

    # 2️⃣ Compute SHA-256 hash
    file_hash = compute_sha256(content)

    # 3️⃣ Generate document ID & storage path
    doc_id = uuid.uuid4()
    s3_key = f"orgs/{org_id}/documents/{doc_id}"

    # 4️⃣ Upload to MinIO
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=s3_key,
        Body=content,
        ContentType=file.content_type,
    )

    # 5️⃣ Save document metadata
    document = Document(
        id=doc_id,                     # UUID
        org_id=org_id,                 # INTEGER
        uploaded_by=uploaded_by,       # INTEGER
        document_type="INVOICE",       # TEMP
        original_filename=file.filename,
        mime_type=file.content_type,
        file_size=len(content),
        s3_key=s3_key,
        sha256_hash=file_hash,
        status="UPLOADED",
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    # ---------------- LEDGER ----------------

    last_entry = (
        db.query(LedgerEntry)
        .filter(LedgerEntry.entity_type == "document")
        .order_by(LedgerEntry.created_at.desc())
        .first()
    )

    previous_hash = last_entry.current_hash if last_entry else None

    current_hash = compute_ledger_hash(
        entity_id=str(document.id),
        document_hash=file_hash,
        action="UPLOAD",
        previous_hash=previous_hash,
    )

    ledger_entry = LedgerEntry(
        entity_type="document",
        entity_id=document.id,      # UUID
        previous_hash=previous_hash,
        current_hash=current_hash,
        action="UPLOAD",
        actor_id=uploaded_by,       # INTEGER
    )

    db.add(ledger_entry)
    db.commit()

    return {
        "document_id": str(document.id),
        "document_sha256": file_hash,
        "ledger_current_hash": current_hash,
        "ledger_previous_hash": previous_hash,
        "message": "Document uploaded and ledger entry created",
    }
