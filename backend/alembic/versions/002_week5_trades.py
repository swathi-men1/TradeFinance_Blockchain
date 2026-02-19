# Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance
"""Add PAID status and trade_documents table for Week 5

Revision ID: 002_week5_trades
Revises: 001_initial_schema
Create Date: 2026-02-02

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_week5_trades'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add PAID status to trade_status enum
    op.execute("ALTER TYPE trade_status ADD VALUE IF NOT EXISTS 'paid'")
    
    # Add trade action values to ledger_action enum
    op.execute("ALTER TYPE ledger_action ADD VALUE IF NOT EXISTS 'TRADE_CREATED'")
    op.execute("ALTER TYPE ledger_action ADD VALUE IF NOT EXISTS 'TRADE_STATUS_UPDATED'")
    op.execute("ALTER TYPE ledger_action ADD VALUE IF NOT EXISTS 'DOCUMENT_LINKED_TO_TRADE'")
    op.execute("ALTER TYPE ledger_action ADD VALUE IF NOT EXISTS 'TRADE_DISPUTED'")
    
    # Create trade_documents association table
    op.create_table(
        'trade_documents',
        sa.Column('trade_id', sa.Integer(), nullable=False),
        sa.Column('document_id', sa.Integer(), nullable=False),
        sa.Column('linked_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['trade_id'], ['trade_transactions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('trade_id', 'document_id')
    )
    
    # Create indexes for trade_documents
    op.create_index('ix_trade_documents_trade_id', 'trade_documents', ['trade_id'])
    op.create_index('ix_trade_documents_document_id', 'trade_documents', ['document_id'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_trade_documents_document_id', table_name='trade_documents')
    op.drop_index('ix_trade_documents_trade_id', table_name='trade_documents')
    
    # Drop trade_documents table
    op.drop_table('trade_documents')
    
    # Note: Cannot remove enum values in PostgreSQL without recreating the entire enum
    # This would require recreating all tables that use these enums
    # For development, leaving the enum values is acceptable
