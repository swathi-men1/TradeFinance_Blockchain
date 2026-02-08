from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from datetime import datetime

class AuditService:
    @staticmethod
    def log_event(db: Session, admin_id: int | None, action: str, target_type: str, target_id: int):
        """
        Create a compliance audit log entry.
        """
        audit_log = AuditLog(
            admin_id=admin_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            timestamp=datetime.utcnow()
        )
        db.add(audit_log)
        db.commit()
