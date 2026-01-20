from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config import DATABASE_URL
from models.base import Base

# Import all models so SQLAlchemy registers them
from models.user import User
from models.document import Document
from models.ledger_entry import LedgerEntry
from models.transaction import TradeTransaction
from models.risk_score import RiskScore

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # Required for SQLite
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def init_db():
    """
    Initializes database tables.
    Must be called once at application startup.
    """
    Base.metadata.create_all(bind=engine)
