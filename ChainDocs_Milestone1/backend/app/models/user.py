
from sqlalchemy import Column, Integer, String, Enum
from app.database import Base
import enum

class RoleEnum(enum.Enum):
    bank = "bank"
    corporate = "corporate"
    auditor = "auditor"
    admin = "admin"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    email = Column(String, unique=True)
    password = Column(String)
    role = Column(Enum(RoleEnum))
    org_name = Column(String)
