"""Add missing enum values to ledger_action

Revision ID: 010_add_missing_enums
Revises: 009_add_admin_ledger_actions
Create Date: 2026-02-14

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '010_add_missing_enums'
down_revision = '009_add_admin_ledger_actions'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add missing document actions
    op.execute("ALTER TYPE ledger_action ADD VALUE IF NOT EXISTS 'DOCUMENT_UPLOADED'")
    op.execute("ALTER TYPE ledger_action ADD VALUE IF NOT EXISTS 'DOCUMENT_UPDATED'")
    op.execute("ALTER TYPE ledger_action ADD VALUE IF NOT EXISTS 'DOCUMENT_DELETED'")

    # Add missing user management actions
    op.execute("ALTER TYPE ledger_action ADD VALUE IF NOT EXISTS 'USER_REGISTERED'")
    op.execute("ALTER TYPE ledger_action ADD VALUE IF NOT EXISTS 'USER_APPROVED'")
    op.execute("ALTER TYPE ledger_action ADD VALUE IF NOT EXISTS 'USER_REJECTED'")
    op.execute("ALTER TYPE ledger_action ADD VALUE IF NOT EXISTS 'USER_UPDATED'")
    op.execute("ALTER TYPE ledger_action ADD VALUE IF NOT EXISTS 'USER_DELETED'")
    op.execute("ALTER TYPE ledger_action ADD VALUE IF NOT EXISTS 'USER_ROLE_ASSIGNED'")

    # Add missing system actions
    op.execute("ALTER TYPE ledger_action ADD VALUE IF NOT EXISTS 'RISK_SCORE_RECALCULATED'")
    op.execute("ALTER TYPE ledger_action ADD VALUE IF NOT EXISTS 'INTEGRITY_CHECK_COMPLETED'")
    op.execute("ALTER TYPE ledger_action ADD VALUE IF NOT EXISTS 'LEDGER_ENTRY_CREATED'")


def downgrade() -> None:
    # PostgreSQL enums cannot easily remove values
    pass
