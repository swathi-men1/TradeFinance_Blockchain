from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    # examples: admin, bank_user, exporter_user

    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)

    # ORM relationship
    organization = relationship("Organization", backref="users")
