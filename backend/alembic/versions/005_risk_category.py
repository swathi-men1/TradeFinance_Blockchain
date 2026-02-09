"""add_risk_category_column

Revision ID: 005
Revises: 004_ledger_hashing
Create Date: 2024-02-09 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005_risk_category'
down_revision = '004_ledger_hashing'
branch_labels = None
depends_on = None


def upgrade():
    """
    Add category column to risk_scores table.
    
    This stores the risk category (LOW/MEDIUM/HIGH) as per mentor requirements.
    The category is calculated from the score:
    - 0-33: LOW
    - 34-66: MEDIUM
    - 67-100: HIGH
    """
    # Add category column
    op.add_column(
        'risk_scores',
        sa.Column('category', sa.String(20), nullable=True)
    )
    
    # Update existing records based on score
    # LOW: 0-33, MEDIUM: 34-66, HIGH: 67-100
    op.execute("""
        UPDATE risk_scores 
        SET category = CASE 
            WHEN score <= 33 THEN 'LOW'
            WHEN score <= 66 THEN 'MEDIUM'
            ELSE 'HIGH'
        END
        WHERE category IS NULL
    """)
    
    # Make column not null after updating existing data
    op.alter_column('risk_scores', 'category', nullable=False, server_default='MEDIUM')


def downgrade():
    """Remove category column from risk_scores table."""
    op.drop_column('risk_scores', 'category')
