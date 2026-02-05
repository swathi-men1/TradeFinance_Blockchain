import uuid
from sqlalchemy import Column, String, BigInteger, TIMESTAMP, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    # Document primary key (UUID)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Organization foreign key
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)

    # Uploaded by user
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    document_type = Column(String, nullable=False)

    original_filename = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    file_size = Column(BigInteger, nullable=False)

    s3_key = Column(String, nullable=False)
    sha256_hash = Column(String(64), nullable=False)

    status = Column(String, nullable=False, default="UPLOADED")

    created_at = Column(TIMESTAMP, server_default=func.now())
