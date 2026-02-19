"""Add document metadata columns (filename, description, mime_type, size)

Revision ID: 012_add_doc_metadata
Revises: 011_add_compliance_alerts
Create Date: 2026-02-19 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '012_add_doc_metadata'
down_revision = '011_add_compliance_alerts'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add missing columns to the documents table
    # These columns were added to the SQLAlchemy model but never migrated to the DB
    op.add_column('documents', sa.Column('filename', sa.String(255), nullable=True))
    op.add_column('documents', sa.Column('description', sa.String(500), nullable=True))
    op.add_column('documents', sa.Column('mime_type', sa.String(100), nullable=True))
    op.add_column('documents', sa.Column('size', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('documents', 'size')
    op.drop_column('documents', 'mime_type')
    op.drop_column('documents', 'description')
    op.drop_column('documents', 'filename')
