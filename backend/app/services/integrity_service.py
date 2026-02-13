from sqlalchemy.orm import Session
from app.models.document import Document
from app.models.ledger import LedgerEntry
from app.core.minio_client import get_file_from_minio
from app.services.risk_service import recalculate_risk_score
import hashlib


def generate_sha256(file_bytes: bytes) -> str:
    """
    Generate SHA256 hash from file bytes.
    """
    sha256 = hashlib.sha256()
    sha256.update(file_bytes)
    return sha256.hexdigest()


def generate_block_hash(data: str) -> str:
    """
    Generate blockchain hash for ledger entry.
    """
    return hashlib.sha256(data.encode()).hexdigest()


def check_document_integrity(db: Session, actor):
    """
    - Verifies document integrity
    - Updates document status
    - Creates blockchain ledger entry
    - Triggers risk recalculation
    """

    alerts = []
    total_documents = 0
    verified_count = 0
    tampered_count = 0
    error_count = 0

    documents = db.query(Document).all()

    # 🔹 Get last ledger entry for blockchain linking
    last_entry = (
        db.query(LedgerEntry)
        .order_by(LedgerEntry.created_at.desc())
        .first()
    )

    previous_hash = last_entry.current_hash if last_entry else None

    for doc in documents:
        total_documents += 1

        try:
            # 🔹 Fetch file from MinIO
            file_bytes = get_file_from_minio(doc.s3_key)

            # 🔹 Recalculate SHA256
            recalculated_hash = generate_sha256(file_bytes)

            if recalculated_hash == doc.sha256_hash:
                doc.status = "VERIFIED"
                verified_count += 1

            else:
                doc.status = "TAMPERED"
                tampered_count += 1

                alerts.append({
                    "document_id": str(doc.id),
                    "uploaded_by": doc.uploaded_by,
                    "status": "TAMPERED"
                })

                # 🔹 Generate blockchain hash
                block_data = f"{doc.id}{actor.id}{previous_hash}"
                current_hash = generate_block_hash(block_data)

                ledger_entry = LedgerEntry(
                    entity_type="DOCUMENT",
                    entity_id=doc.id,
                    previous_hash=previous_hash,
                    current_hash=current_hash,
                    action="INTEGRITY_FAILURE",
                    actor_id=actor.id,
                    description=f"Integrity failed for document {doc.id}"
                )

                db.add(ledger_entry)

                # 🔹 Update previous hash for next iteration
                previous_hash = current_hash

                # 🔹 Trigger risk recalculation
                recalculate_risk_score(doc.uploaded_by, db)

        except Exception as e:
            error_count += 1
            alerts.append({
                "document_id": str(doc.id),
                "status": "ERROR",
                "error": str(e)
            })

    # 🔹 Commit all DB updates once
    db.commit()

    return {
        "status": "completed",
        "triggered_by": {
            "user_id": actor.id,
            "role": actor.role

        },
        "total_documents": total_documents,
        "verified": verified_count,
        "tampered": tampered_count,
        "errors": error_count,
        "alerts": alerts
    }
