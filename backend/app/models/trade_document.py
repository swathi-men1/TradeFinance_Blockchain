from sqlalchemy import Column, Integer, ForeignKey, TIMESTAMP, func, Table
from app.db.base import Base

# Association table for Trade-Document many-to-many relationship
trade_documents = Table(
    'trade_documents',
    Base.metadata,
    Column('trade_id', Integer, ForeignKey('trade_transactions.id', ondelete='CASCADE'), primary_key=True),
    Column('document_id', Integer, ForeignKey('documents.id', ondelete='CASCADE'), primary_key=True),
    Column('linked_at', TIMESTAMP, server_default=func.now(), nullable=False),
    extend_existing=True
)
