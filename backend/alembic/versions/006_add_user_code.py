"""add user_code column

Revision ID: 006_add_user_code
Revises: 005_risk_category
Create Date: 2026-02-11 23:57:00

"""
from alembic import op
import sqlalchemy as sa
import random
import string


# revision identifiers, used by Alembic.
revision = '006_add_user_code'
down_revision = '005_risk_category'
branch_labels = None
depends_on = None


def generate_user_code_from_name(name: str, existing_codes: set) -> str:
    """Generate a unique user code for migration"""
    # Extract first 3 letters from name
    name_clean = ''.join(char for char in name if char.isalpha())
    name_prefix = name_clean[:3].upper().ljust(3, 'X')
    
    # Try to generate unique code
    for _ in range(100):
        random_suffix = ''.join(random.choices(string.digits, k=3))
        user_code = f"{name_prefix}{random_suffix}"
        if user_code not in existing_codes:
            existing_codes.add(user_code)
            return user_code
    
    # Fallback
    for _ in range(100):
        user_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if user_code not in existing_codes:
            existing_codes.add(user_code)
            return user_code
    
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


def upgrade() -> None:
    # Add user_code column as nullable first
    op.add_column('users', sa.Column('user_code', sa.String(10), nullable=True))
    
    # Get connection to update existing rows
    connection = op.get_bind()
    
    # Fetch all existing users
    result = connection.execute(sa.text("SELECT id, name FROM users"))
    users = result.fetchall()
    
    # Generate and assign user codes for existing users
    existing_codes = set()
    for user_id, name in users:
        user_code = generate_user_code_from_name(name or "User", existing_codes)
        connection.execute(
            sa.text("UPDATE users SET user_code = :code WHERE id = :id"),
            {"code": user_code, "id": user_id}
        )
    
    # Now make the column non-nullable and unique
    op.alter_column('users', 'user_code', nullable=False)
    op.create_index(op.f('ix_users_user_code'), 'users', ['user_code'], unique=True)


def downgrade() -> None:
    # Remove index and column
    op.drop_index(op.f('ix_users_user_code'), table_name='users')
    op.drop_column('users', 'user_code')
