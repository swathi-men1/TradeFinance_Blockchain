import uuid
from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.minio_client import s3_client, BUCKET_NAME
from app.utils.hash_utils import compute_sha256
from app.models.document import Document
from app.models.ledger import LedgerEntry
from app.utils.ledger_utils import compute_ledger_hash

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # TEMP (Week 4 → JWT will replace this)
    org_id = uuid.uuid4()
    user_id = uuid.uuid4()

    # 1️⃣ Read file
    content = await file.read()

    # 2️⃣ Compute document hash (SHA-256)
    file_hash = compute_sha256(content)

    # 3️⃣ Storage path
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
        id=doc_id,
        org_id=org_id,
        uploaded_by=user_id,
        original_filename=file.filename,
        mime_type=file.content_type,
        file_size=len(content),
        s3_key=s3_key,
        sha256_hash=file_hash,
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    # -------------------- LEDGER LOGIC (WEEK 4) --------------------

    # Get previous ledger entry (last block)
    last_entry = (
        db.query(LedgerEntry)
        .order_by(LedgerEntry.created_at.desc())
        .first()
    )

    previous_hash = last_entry.document_hash if last_entry else None

    # Create chained ledger hash
    ledger_hash = compute_ledger_hash(
        document_hash=file_hash,
        previous_hash=previous_hash
    )

    ledger_entry = LedgerEntry(
        document_id=document.id,
        document_hash=ledger_hash,
        previous_hash=previous_hash
    )

    db.add(ledger_entry)
    db.commit()

    # -------------------- RESPONSE --------------------
    return {
        "document_id": str(document.id),
        "document_sha256": file_hash,
        "ledger_hash": ledger_hash,
        "previous_ledger_hash": previous_hash,
        "message": "Document uploaded and ledger entry created"
    }
