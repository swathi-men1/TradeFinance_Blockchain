# /* Author: Abdul Samad | */
from celery_app import celery_app
from db.session import SessionLocal
from db.models import Documents
from services.integrity_service import IntegrityService
import logging

logger = logging.getLogger(__name__)

@celery_app.task(name="scan_all_documents")
def scan_all_documents():
    """
    Batch job to audit ALL documents in the system.
    Detects tampering and triggers self-healing (locking trades) automatically.
    """
    logger.info("Starting System-Wide Integrity Scan...")
    db = SessionLocal()
    try:
        # Fetch all document IDs
        # Query ID only for efficiency
        doc_ids = db.query(Documents.id).all()
        doc_ids = [d[0] for d in doc_ids]
        
        results = {"scanned": 0, "tampered": 0, "errors": 0}
        
        for doc_id in doc_ids:
            try:
                # System User (None) or Admin (1) as actor
                audit_result = IntegrityService.verify_document(db, doc_id, user_id=None)
                
                results["scanned"] += 1
                if audit_result["status"] in ["TAMPERED", "FILE_MISSING"]:
                    results["tampered"] += 1
                    logger.warning(f"Integrity Failure for Doc {doc_id}: {audit_result['message']}")
            except Exception as e:
                results["errors"] += 1
                logger.error(f"Error scanning Doc {doc_id}: {e}")
        
        logger.info(f"Scan Complete. Results: {results}")
        return results
        
    except Exception as e:
        logger.error(f"Scan Fatal Error: {e}")
        raise e
    finally:
        db.close()
