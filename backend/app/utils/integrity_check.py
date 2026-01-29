from app.models.document import Document
from app.utils.hash_utils import compute_sha256
from app.core.minio_client import s3_client, BUCKET_NAME


def check_document_integrity(db):
    alerts = []

    documents = db.query(Document).all()

    for doc in documents:
        # Fetch file from MinIO
        obj = s3_client.get_object(
            Bucket=BUCKET_NAME,
            Key=doc.s3_key
        )
        content = obj["Body"].read()

        # Recompute hash
        current_hash = compute_sha256(content)

        # Compare hashes
        if current_hash != doc.sha256_hash:
            alerts.append({
                "document_id": str(doc.id),
                "issue": "Hash mismatch detected",
                "expected_hash": doc.sha256_hash,
                "current_hash": current_hash
            })

    return alerts
