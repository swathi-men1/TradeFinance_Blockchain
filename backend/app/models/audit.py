# Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance
from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(Text, nullable=False)
    target_type = Column(String(50), nullable=True)
    target_id = Column(Integer, nullable=True)
    timestamp = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    
    # Relationships
    admin = relationship("User", backref="audit_actions")
    
    @staticmethod
    def log_action(db, admin_id, action, target_type, target_id):
        """Helper method to create an audit log entry"""
        audit_log = AuditLog(
            admin_id=admin_id,
            action=action,
            target_type=target_type,
            target_id=target_id
        )
        db.add(audit_log)
        db.commit()
        return audit_log
