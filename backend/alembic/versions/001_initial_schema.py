"""Initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-01-25

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create custom types with checkfirst=True to handle retry scenarios
    # Note: create_type=False prevents automatic creation when used in table columns
    user_role = postgresql.ENUM('bank', 'corporate', 'auditor', 'admin', name='user_role', create_type=False)
    user_role.create(op.get_bind(), checkfirst=True)
    
    document_type = postgresql.ENUM('LOC', 'INVOICE', 'BILL_OF_LADING', 'PO', 'COO', 'INSURANCE_CERT', name='document_type', create_type=False)
    document_type.create(op.get_bind(), checkfirst=True)
    
    ledger_action = postgresql.ENUM('ISSUED', 'AMENDED', 'SHIPPED', 'RECEIVED', 'PAID', 'CANCELLED', 'VERIFIED', name='ledger_action', create_type=False)
    ledger_action.create(op.get_bind(), checkfirst=True)
    
    trade_status = postgresql.ENUM('pending', 'in_progress', 'completed', 'disputed', name='trade_status', create_type=False)
    trade_status.create(op.get_bind(), checkfirst=True)
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password', sa.String(length=255), nullable=False),
        sa.Column('role', user_role, nullable=False),
        sa.Column('org_name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_id', 'users', ['id'], unique=False)
    op.create_index('ix_users_org_name', 'users', ['org_name'], unique=False)
    
    # Create documents table
    op.create_table(
        'documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('doc_type', document_type, nullable=False),
        sa.Column('doc_number', sa.String(length=100), nullable=False),
        sa.Column('file_url', sa.String(length=500), nullable=False),
        sa.Column('hash', sa.String(length=64), nullable=False),
        sa.Column('issued_at', sa.TIMESTAMP(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_documents_id', 'documents', ['id'], unique=False)
    op.create_index('ix_documents_owner_id', 'documents', ['owner_id'], unique=False)
    op.create_index('ix_documents_doc_type', 'documents', ['doc_type'], unique=False)
    op.create_index('ix_documents_created_at', 'documents', [sa.text('created_at DESC')], unique=False)
    
    # Create ledger_entries table
    op.create_table(
        'ledger_entries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('document_id', sa.Integer(), nullable=False),
        sa.Column('action', ledger_action, nullable=False),
        sa.Column('actor_id', sa.Integer(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_ledger_entries_id', 'ledger_entries', ['id'], unique=False)
    op.create_index('ix_ledger_document_id', 'ledger_entries', ['document_id'], unique=False)
    op.create_index('ix_ledger_created_at', 'ledger_entries', [sa.text('created_at DESC')], unique=False)
    
    # Create trade_transactions table
    op.create_table(
        'trade_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('buyer_id', sa.Integer(), nullable=False),
        sa.Column('seller_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('status', trade_status, nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['buyer_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['seller_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_trade_transactions_id', 'trade_transactions', ['id'], unique=False)
    op.create_index('ix_trades_buyer_id', 'trade_transactions', ['buyer_id'], unique=False)
    op.create_index('ix_trades_seller_id', 'trade_transactions', ['seller_id'], unique=False)
    op.create_index('ix_trades_status', 'trade_transactions', ['status'], unique=False)
    
    # Create risk_scores table
    op.create_table(
        'risk_scores',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('score', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('rationale', sa.Text(), nullable=False),
        sa.Column('last_updated', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.CheckConstraint('score >= 0 AND score <= 100', name='score_range_check'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index('ix_risk_scores_id', 'risk_scores', ['id'], unique=False)
    op.create_index('ix_risk_user_id', 'risk_scores', ['user_id'], unique=False)
    op.create_index('ix_risk_score', 'risk_scores', [sa.text('score DESC')], unique=False)
    
    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('admin_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.Text(), nullable=False),
        sa.Column('target_type', sa.String(length=50), nullable=True),
        sa.Column('target_id', sa.Integer(), nullable=True),
        sa.Column('timestamp', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['admin_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_audit_logs_id', 'audit_logs', ['id'], unique=False)
    op.create_index('ix_audit_admin_id', 'audit_logs', ['admin_id'], unique=False)
    op.create_index('ix_audit_timestamp', 'audit_logs', [sa.text('timestamp DESC')], unique=False)
    op.create_index('ix_audit_target', 'audit_logs', ['target_type', 'target_id'], unique=False)


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('risk_scores')
    op.drop_table('trade_transactions')
    op.drop_table('ledger_entries')
    op.drop_table('documents')
    op.drop_table('users')
    
    sa.Enum(name='trade_status').drop(op.get_bind())
    sa.Enum(name='ledger_action').drop(op.get_bind())
    sa.Enum(name='document_type').drop(op.get_bind())
    sa.Enum(name='user_role').drop(op.get_bind())
