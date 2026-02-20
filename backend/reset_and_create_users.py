#!/usr/bin/env python
"""Reset database and create new users with fresh migrations"""
from app.db.base import Base
from app.db.session import engine
from app.models.user import User, UserRole
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.core.security import hash_password
import random
import string
import sys

# Fix encoding for Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Generate random password
def generate_password(length=12):
    """Generate a secure random password"""
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(random.choice(characters) for _ in range(length))

def generate_user_code(name):
    """Generate a user code from name (e.g., JOH847)"""
    # Take first 3 letters of name
    initials = ''.join([word[0].upper() for word in name.split()[:2]])
    if len(initials) < 3:
        initials = name[:3].upper()
    # Add random digits
    digits = ''.join(random.choices(string.digits, k=3))
    return (initials + digits)[:10]  # Max 10 chars

try:
    # Step 1: Drop and recreate all tables
    print("=" * 100)
    print("STEP 1: REBUILDING DATABASE SCHEMA")
    print("=" * 100)
    
    # Drop tables with CASCADE to handle foreign keys
    with engine.connect() as connection:
        # Get all tables
        inspector_result = connection.execute(text("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public'
        """))
        
        tables = [row[0] for row in inspector_result]
        
        for table in tables:
            try:
                connection.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
                print(f"  [OK] Dropped {table}")
            except Exception as e:
                print(f"  [-] {table}: {str(e)}")
        
        connection.commit()
    
    Base.metadata.create_all(bind=engine)
    print("  [OK] Recreated all tables from models\n")
    
    # Step 2: Create new users with new passwords
    print("=" * 100)
    print("STEP 2: CREATING NEW USER ACCOUNTS")
    print("=" * 100)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    # Define new users
    new_users_data = [
        {
            "name": "System Admin",
            "email": "admin@tradefinance.com",
            "role": UserRole.ADMIN,
            "org_name": "System",
        },
        {
            "name": "Bank User",
            "email": "bank@tradefinance.com",
            "role": UserRole.BANK,
            "org_name": "Trade Bank Corp",
        },
        {
            "name": "Corporate User",
            "email": "corporate@tradefinance.com",
            "role": UserRole.CORPORATE,
            "org_name": "Global Trades Inc",
        },
        {
            "name": "Auditor User",
            "email": "auditor@tradefinance.com",
            "role": UserRole.AUDITOR,
            "org_name": "Audit & Compliance Ltd",
        },
    ]
    
    credentials = []
    
    for user_data in new_users_data:
        password = generate_password()
        user_code = generate_user_code(user_data["name"])
        hashed_password = hash_password(password)
        
        user = User(
            user_code=user_code,
            name=user_data["name"],
            email=user_data["email"],
            password=hashed_password,
            role=user_data["role"],
            org_name=user_data["org_name"],
            is_active=True
        )
        
        db.add(user)
        credentials.append({
            "user_code": user_code,
            "name": user_data["name"],
            "email": user_data["email"],
            "password": password,
            "role": user_data["role"].value
        })
    
    db.commit()
    print(f"  [OK] Created {len(credentials)} new user accounts\n")
    
    # Step 3: Display new accounts and passwords
    print("=" * 100)
    print("NEW USER ACCOUNTS AND CREDENTIALS")
    print("=" * 100)
    
    print(f"\n{'#':<3} {'User Code':<12} {'Name':<20} {'Email':<35} {'Password':<20}")
    print("-" * 100)
    
    for i, cred in enumerate(credentials, 1):
        print(f"{i:<3} {cred['user_code']:<12} {cred['name']:<20} {cred['email']:<35} {cred['password']:<20}")
    
    print("\n" + "=" * 100)
    print("DETAILED CREDENTIALS")
    print("=" * 100)
    
    for cred in credentials:
        print(f"\nUser Code: {cred['user_code']}")
        print(f"Email: {cred['email']}")
        print(f"Password: {cred['password']}")
        print(f"Name: {cred['name']}")
        print(f"Role: {cred['role']}")
        print("-" * 50)
    
    print("\n" + "=" * 100)
    print("SUCCESS: USER ACCOUNTS CREATED")
    print("=" * 100)
    print("\nIMPORTANT: Save these credentials securely!")
    print("    These passwords are only shown once.")
    
    db.close()

except Exception as e:
    print(f"Error: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
