from sqlalchemy import Column, Integer, String, Enum, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship
from app.db.base_class import Base
import enum


class DocumentType(str, enum.Enum):
    LOC = "LOC"
    INVOICE = "INVOICE"
    BILL_OF_LADING = "BILL_OF_LADING"
    PO = "PO"
    COO = "COO"
    INSURANCE_CERT = "INSURANCE_CERT"


class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    doc_type = Column(Enum(DocumentType, name='document_type'), nullable=False)
    doc_number = Column(String(100), nullable=False)
    file_url = Column(String(500), nullable=False)
    hash = Column(String(64), nullable=False)  # SHA-256
    issued_at = Column(TIMESTAMP, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    
    # Relationships
    owner = relationship("User", backref="documents")
    ledger_entries = relationship("LedgerEntry", back_populates="document", cascade="all, delete-orphan")
