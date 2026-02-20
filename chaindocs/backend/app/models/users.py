from sqlalchemy import Column, Integer, String, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.models.enums import UserRole
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    role = Column(Enum(UserRole))
    org_id = Column(Integer, ForeignKey("organizations.id"))

    organization = relationship("Organization")
    hashed_password = Column(String, nullable=False)
