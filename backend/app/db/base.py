from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    """Base class for all models"""
    pass

# Import all models here so Alembic/SQLAlchemy can detect them
# and create the tables in the database.
from app.models.user import User
from app.models.trade import TradeTransaction
from app.models.document import Document
from app.models.risk_score import RiskScore
from app.models.ledger import LedgerEntry
from app.models.audit import AuditLog
from app.models.compliance_alert import ComplianceAlert  # <--- This fixes the 500 error