# Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance
from sqlalchemy import Column, Integer, String, Enum, TIMESTAMP, func, Boolean
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import enum

class OrganizationStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    PENDING = "pending"

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    org_name = Column(String(255), unique=True, nullable=False, index=True)
    status = Column(Enum(OrganizationStatus), default=OrganizationStatus.ACTIVE, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    
    # Relationships
    # Note: User model currently has org_name as String. We should ideally link it via ForeignKey, 
    # but for compatibility with existing User model, we'll keep it as loose coupling or update User later if needed.
    # For now, we can query users by org_name.
