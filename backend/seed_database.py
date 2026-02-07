"""
Database seeding script for Trade Finance Blockchain Explorer
Creates test users for different roles: Admin, Corporate, Bank, Auditor

Usage:
    # Run inside Docker container:
    docker-compose exec backend python seed_database.py
"""

import sys
import os
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from app.db.session import SessionLocal
from app.core.security import hash_password


def seed_users_with_sql(db_session, force: bool = False):
    """Seed users using raw SQL to avoid enum type issues"""
    
    # Define test users
    test_users = [
        {
            "name": "System Administrator",
            "email": "admin@tradefinance.com",
            "password": "admin123!@#",
            "role": "admin",
            "org_name": "Trade Finance Platform"
        },
        {
            "name": "John Corporate",
            "email": "corporate@company.com",
            "password": "corporate123!@#",
            "role": "corporate",
            "org_name": "Acme Corporation"
        },
        {
            "name": "Sarah Banking",
            "email": "bank@globalbank.com",
            "password": "bank123!@#",
            "role": "bank",
            "org_name": "Global Bank Ltd"
        },
        {
            "name": "Michael Auditor",
            "email": "auditor@auditfirm.com",
            "password": "auditor123!@#",
            "role": "auditor",
            "org_name": "Independent Audit Services"
        }
    ]
    
    print("Checking existing users...")
    result = db_session.execute(text("SELECT COUNT(*) FROM users"))
    existing_count = result.scalar()
    
    if existing_count > 0 and not force:
        print(f"Database already has {existing_count} user(s).")
        print("\nExisting users:")
        result = db_session.execute(text("SELECT email, role, org_name FROM users ORDER BY id"))
        for row in result:
            print(f"  - {row[0]} ({row[1]}) - {row[2]}")
        
        print("\n💡 Tip: To add missing test users anyway, run with --force flag")
        print("        docker-compose exec backend python seed_database.py --force")
        return
    
    print("\nCreating test users...")
    users_created = 0
    users_skipped = 0
    
    for user_data in test_users:
        # Check if user with this email already exists
        result = db_session.execute(
            text("SELECT COUNT(*) FROM users WHERE email = :email"),
            {"email": user_data["email"]}
        )
        exists = result.scalar() > 0
        
        if exists:
            print(f"  ⊘ Skipped {user_data['role']} user: {user_data['email']} (already exists)")
            users_skipped += 1
            continue
        
        # Hash the password
        hashed_password = hash_password(user_data["password"])
        
        # Insert using raw SQL
        db_session.execute(
            text("""
                INSERT INTO users (name, email, password, role, org_name)
                VALUES (:name, :email, :password, CAST(:role AS user_role), :org_name)
            """),
            {
                "name": user_data["name"],
                "email": user_data["email"],
                "password": hashed_password,
                "role": user_data["role"],
                "org_name": user_data["org_name"]
            }
        )
        print(f"  ✓ Created {user_data['role']} user: {user_data['email']}")
        users_created += 1
    
    if users_created > 0:
        db_session.commit()
        print(f"\n✅ Database seeding completed! Created {users_created} new user(s).")
    else:
        print(f"\n✅ All test users already exist. No changes made.")
    
    if users_skipped > 0:
        print(f"   ({users_skipped} user(s) skipped - already existed)")


def main():
    """Main function to run database seeding"""
    print("=" * 60)
    print("Trade Finance Blockchain Explorer - Database Seeding")
    print("=" * 60)
    print()
    
    # Check for --force flag
    force = "--force" in sys.argv or "-f" in sys.argv
    
    if force:
        print("⚠️  Force mode enabled - will add missing users\n")
    
    # Create database session
    db = SessionLocal()
    
    try:
        seed_users_with_sql(db, force=force)
    except Exception as e:
        print(f"\n❌ Error during seeding: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()
    
    print("\nSeeding process finished.")
    print("\n📋 See PRIVATE_CREDENTIALS.md for login details")


if __name__ == "__main__":
    main()
