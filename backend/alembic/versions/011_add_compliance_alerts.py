# Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance
"""Add compliance alerts table

Revision ID: 011_add_compliance_alerts
Revises: 48f32a852404
Create Date: 2026-02-15 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '011_add_compliance_alerts'
down_revision = '48f32a852404'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create Enum types
    # Use checkfirst=True to avoid errors if they already exist (though they shouldn't)
    alert_type = postgresql.ENUM(
        'DOCUMENT_HASH_MISMATCH',
        'MISSING_LIFECYCLE_STAGE',
        'DUPLICATE_LEDGER_ACTION',
        'UNAUTHORIZED_ACTOR',
        'SUSPICIOUS_TRANSACTION_PATTERN',
        'INTEGRITY_CHECK_FAILURE',
        'COMPLIANCE_VIOLATION',
        name='alert_type',
        create_type=False
    )
    alert_type.create(op.get_bind(), checkfirst=True)

    alert_status = postgresql.ENUM(
        'OPEN',
        'INVESTIGATING',
        'RESOLVED',
        'DISMISSED',
        name='alert_status',
        create_type=False
    )
    alert_status.create(op.get_bind(), checkfirst=True)

    severity_enum = postgresql.ENUM(
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL',
        name='severity',
        create_type=False
    )
    severity_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        'compliance_alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('alert_type', alert_type, nullable=False),
        sa.Column('severity', severity_enum, nullable=False, server_default='MEDIUM'),
        sa.Column('status', alert_status, nullable=False, server_default='OPEN'),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('document_id', sa.Integer(), nullable=True),
        sa.Column('trade_id', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('ledger_entry_id', sa.Integer(), nullable=True),
        sa.Column('detected_at', sa.TIMESTAMP(), server_default=sa.text('now()'), nullable=False),
        sa.Column('resolved_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('resolved_by', sa.Integer(), nullable=True),
        sa.Column('resolution_notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['trade_id'], ['trade_transactions.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['ledger_entry_id'], ['ledger_entries.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['resolved_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_compliance_alerts_id'), 'compliance_alerts', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_compliance_alerts_id'), table_name='compliance_alerts')
    op.drop_table('compliance_alerts')
    
    op.execute("DROP TYPE IF EXISTS alert_type")
    op.execute("DROP TYPE IF EXISTS alert_status")
    op.execute("DROP TYPE IF EXISTS severity")
