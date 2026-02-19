from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from database import Base

class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    active = Column(Integer, default=0)


class TradeDB(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    seller = Column(String)
    product = Column(String)
    quantity = Column(Integer)
    price = Column(Float)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class DocumentDB(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True)
    trade_id = Column(Integer)
    doc_type = Column(String)
    hash = Column(String)


class LedgerDB(Base):
    __tablename__ = "ledger"

    id = Column(Integer, primary_key=True)
    action = Column(String)
    details = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)


class RiskScoreDB(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True)
    trade_id = Column(Integer)
    username = Column(String)
    risk_score = Column(Integer)
    risk_level = Column(String)
    updated_at = Column(DateTime, default=datetime.utcnow)


class BlockDB(Base):
    __tablename__ = "blocks"

    id = Column(Integer, primary_key=True)
    index = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)
    data = Column(String)
    previous_hash = Column(String)
    hash = Column(String)
