"""Add ledger hashing and integrity reporting

Revision ID: 004_ledger_hashing
Revises: 003_allow_null_document_id
Create Date: 2026-02-07

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004_ledger_hashing'
down_revision = '003_allow_null_document_id'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add hash columns to ledger_entries
    op.add_column('ledger_entries', sa.Column('previous_hash', sa.String(length=64), nullable=True))
    op.add_column('ledger_entries', sa.Column('entry_hash', sa.String(length=64), nullable=True))
    
    # Create unique index on entry_hash
    op.create_index(op.f('ix_ledger_entries_entry_hash'), 'ledger_entries', ['entry_hash'], unique=True)

    # Create integrity_reports table
    op.create_table('integrity_reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('document_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('checked_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_integrity_reports_id'), 'integrity_reports', ['id'], unique=False)


def downgrade() -> None:
    # Drop integrity_reports table
    op.drop_index(op.f('ix_integrity_reports_id'), table_name='integrity_reports')
    op.drop_table('integrity_reports')

    # Drop hash columns from ledger_entries
    op.drop_index(op.f('ix_ledger_entries_entry_hash'), table_name='ledger_entries')
    op.drop_column('ledger_entries', 'entry_hash')
    op.drop_column('ledger_entries', 'previous_hash')
