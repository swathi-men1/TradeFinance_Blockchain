from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base

# USERS TABLE
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)


# DOCUMENTS TABLE
class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    file_hash = Column(String)
    owner_email = Column(String)  # simple link for now
