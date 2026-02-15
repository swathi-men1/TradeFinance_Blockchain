from sqlalchemy import Column, Integer, String, Enum, TIMESTAMP, func, Boolean
from app.db.base import Base
import enum
import random


class UserRole(str, enum.Enum):
    BANK = "bank"
    CORPORATE = "corporate"
    AUDITOR = "auditor"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    user_code = Column(String(10), unique=True, nullable=False, index=True)  # Display ID (e.g., JOH847)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)  # Hashed
    role = Column(Enum(UserRole, name='user_role', values_callable=lambda x: [e.value for e in x]), nullable=False)
    org_name = Column(String(255), nullable=False, index=True)
    is_active = Column(Boolean, default=False, nullable=False)  # Admin approval required
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
