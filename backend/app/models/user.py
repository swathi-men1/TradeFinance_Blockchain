from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, index=True, nullable=False)

    # Store ONLY hashed password
    hashed_password = Column(String, nullable=False)

    # Roles: corporate, bank, auditor, admin
    role = Column(String, nullable=False, default="corporate")

    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)

    # ORM relationship
    organization = relationship("Organization", backref="users")
