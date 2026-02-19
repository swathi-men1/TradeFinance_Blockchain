# Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance
from app.db.base_class import Base

# Import all models here so Alembic/SQLAlchemy can detect them
# and create the tables in the database.
from app.models.user import User
from app.models.trade import TradeTransaction
from app.models.document import Document
from app.models.risk import RiskScore
from app.models.ledger import LedgerEntry
from app.models.audit import AuditLog
from app.models.compliance_alert import ComplianceAlert  # <--- This fixes the 500 error