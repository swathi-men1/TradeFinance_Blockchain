#!/usr/bin/env python
"""Delete all existing users and create new accounts with new passwords"""
from app.db.session import SessionLocal, engine
from app.models.user import User, UserRole
from app.core.security import hash_password
from sqlalchemy import text
import random
import string

# Generate random passwords
def generate_password(length=12):
    """Generate a secure random password"""
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(random.choice(characters) for _ in range(length))

db = SessionLocal()

try:
    # Step 1: Delete all dependent data first (due to foreign key constraints)
    print("=" * 100)
    print("STEP 1: CLEANING UP DATABASE (REMOVING DEPENDENT DATA)")
    print("=" * 100)
    
    # Delete in order of dependencies
    tables_to_clear = [
        "trade_transactions",
        "audit_logs", 
        "compliance_alerts",
        "ledger_entries",
        "trades",
        "documents",
        "users"
    ]
    
    for table in tables_to_clear:
        try:
            with engine.connect() as connection:
                connection.execute(text(f"DELETE FROM {table}"))
                connection.commit()
            print(f"  ✓ Cleared {table}")
        except Exception as e:
            print(f"  - {table}: {str(e)}")
    
    # Step 2: Create new users with new passwords
    print("\n" + "=" * 100)
    print("STEP 2: CREATING NEW USER ACCOUNTS")
    print("=" * 100)
    
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
    
    new_users = []
    credentials = []
    
    for user_data in new_users_data:
        password = generate_password()
        hashed_password = hash_password(password)
        
        user = User(
            name=user_data["name"],
            email=user_data["email"],
            password=hashed_password,
            role=user_data["role"],
            org_name=user_data["org_name"],
            is_active=True
        )
        
        db.add(user)
        new_users.append(user)
        credentials.append({
            "name": user_data["name"],
            "email": user_data["email"],
            "password": password,
            "role": user_data["role"].value
        })
    
    db.commit()
    print(f"  ✓ Created {len(new_users)} new user accounts\n")
    
    # Step 3: Display new accounts and passwords
    print("=" * 100)
    print("NEW USER ACCOUNTS AND CREDENTIALS")
    print("=" * 100)
    
    print(f"\n{'#':<3} {'Name':<20} {'Email':<35} {'Role':<12} {'Password':<20}")
    print("-" * 100)
    
    for i, cred in enumerate(credentials, 1):
        print(f"{i:<3} {cred['name']:<20} {cred['email']:<35} {cred['role']:<12} {cred['password']:<20}")
    
    print("\n" + "=" * 100)
    print("DETAILED CREDENTIALS")
    print("=" * 100)
    
    for cred in credentials:
        print(f"\nEmail: {cred['email']}")
        print(f"Password: {cred['password']}")
        print(f"Name: {cred['name']}")
        print(f"Role: {cred['role']}")
        print("-" * 50)
    
    print("\n" + "=" * 100)
    print("USER ACCOUNTS SUCCESSFULLY CREATED")
    print("=" * 100)
    print("\nIMPORTANT: Save these credentials securely!")
    print("    These passwords are only shown once.")
    
except Exception as e:
    db.rollback()
    print(f"Error: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()

finally:
    db.close()
