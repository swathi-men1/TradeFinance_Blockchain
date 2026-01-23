"""
Database initialization and dummy data insertion.
This creates sample users for testing all roles.
"""

from sqlalchemy.orm import Session
from app.models.models import User, UserRole
from app.core.security import get_password_hash
import json


DUMMY_USERS = [
    {
        "username": "admin_user",
        "email": "admin@chaindocs.com",
        "full_name": "System Administrator",
        "password": "admin123",
        "role": UserRole.ADMIN,
    },
    {
        "username": "bank_user",
        "email": "bank@chaindocs.com",
        "full_name": "Bank Officer",
        "password": "bank123",
        "role": UserRole.BANK,
    },
    {
        "username": "corporate_user",
        "email": "corporate@chaindocs.com",
        "full_name": "Corporate Officer",
        "password": "corporate123",
        "role": UserRole.CORPORATE,
    },
    {
        "username": "auditor_user",
        "email": "auditor@chaindocs.com",
        "full_name": "Internal Auditor",
        "password": "auditor123",
        "role": UserRole.AUDITOR,
    },
]


def init_dummy_data(db: Session):
    """
    Create dummy users if they don't already exist.
    This runs on startup.
    """
    
    print("\n" + "="*70)
    print("📝 INITIALIZING DUMMY DATA")
    print("="*70)
    
    # Check how many users exist
    existing_users_count = db.query(User).count()
    
    if existing_users_count > 0:
        print(f"✅ Users table already populated ({existing_users_count} users found)")
        print("   Skipping dummy data insertion\n")
        return
    
    print(f"📍 Creating {len(DUMMY_USERS)} dummy users for testing...\n")
    
    created_users = []
    
    for user_data in DUMMY_USERS:
        user = User(
            username=user_data["username"],
            email=user_data["email"],
            full_name=user_data["full_name"],
            hashed_password=get_password_hash(user_data["password"]),
            role=user_data["role"],
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        created_users.append(user)
        
        print(f"✅ Created user: {user.username}")
        print(f"   - Role: {user.role.value}")
        print(f"   - Email: {user.email}")
        print(f"   - Password: {user_data['password']}")
        print(f"   - ID: {user.id}\n")
    
    print("="*70)
    print(f"✅ DUMMY DATA CREATED: {len(created_users)} users")
    print("="*70)
    print("\n🔑 TEST CREDENTIALS:")
    print("   ┌─────────────────────────────────────────────┐")
    for user_data in DUMMY_USERS:
        print(f"   │ {user_data['username']:20} | {user_data['password']:15} │")
    print("   └─────────────────────────────────────────────┘\n")
