"""Allow null document_id in ledger_entries

Revision ID: 003_allow_null_document_id
Revises: 002_week5_trades
Create Date: 2026-02-07

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003_allow_null_document_id'
down_revision = '002_week5_trades'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make document_id nullable in ledger_entries
    op.alter_column('ledger_entries', 'document_id',
               existing_type=sa.Integer(),
               nullable=True)


def downgrade() -> None:
    # Revert document_id to not null
    # Note: This might fail if there are existing rows with null document_id
    op.alter_column('ledger_entries', 'document_id',
               existing_type=sa.Integer(),
               nullable=False)
