"""
Database seeding script for Trade Finance Blockchain Explorer
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
    """Seed users using raw SQL"""
    
    test_users = [
        {
            "name": "System Administrator",
            "email": "admin@tradefinance.com",
            "password": "admin123!@#",
            "role": "admin",
            "org_name": "Trade Finance Platform",
            "user_code": "ADM-001"
        },
        {
            "name": "John Corporate",
            "email": "corporate@company.com",
            "password": "corporate123!@#",
            "role": "corporate",
            "org_name": "Acme Corporation",
            "user_code": "CORP-001"
        },
        {
            "name": "Sarah Banking",
            "email": "bank@globalbank.com",
            "password": "bank123!@#",
            "role": "bank",
            "org_name": "Global Bank Ltd",
            "user_code": "BANK-001"
        },
        {
            "name": "Michael Auditor",
            "email": "auditor@auditfirm.com",
            "password": "auditor123!@#",
            "role": "auditor",
            "org_name": "Independent Audit Services",
            "user_code": "AUD-001"
        }
    ]
    
    print("Checking existing users...")
    try:
        result = db_session.execute(text("SELECT COUNT(*) FROM users"))
        existing_count = result.scalar()
    except Exception as e:
        print(f"Error checking users: {e}")
        db_session.rollback()
        return

    if existing_count > 0 and not force:
        print(f"Database already has {existing_count} user(s). Run with --force to update.")
        return
    
    print("\nCreating/Updating test users...")
    users_created = 0
    users_updated = 0
    
    for user_data in test_users:
        try:
            # Check if user with this email already exists
            result = db_session.execute(
                text("SELECT COUNT(*) FROM users WHERE email = :email"),
                {"email": user_data["email"]}
            )
            exists = result.scalar() > 0
            
            hashed_password = hash_password(user_data["password"])

            if exists:
                if force:
                    # Update password AND force is_active = true
                    db_session.execute(
                        text("""
                            UPDATE users 
                            SET password = :password, is_active = true 
                            WHERE email = :email
                        """),
                        {"password": hashed_password, "email": user_data["email"]}
                    )
                    db_session.commit()
                    print(f"  ↻ Updated and activated {user_data['role']}: {user_data['email']}")
                    users_updated += 1
                else:
                    print(f"  ⊘ Skipped {user_data['role']}: {user_data['email']} (exists)")
                continue
            
            # Insert new user with is_active = true
            db_session.execute(
                text("""
                    INSERT INTO users (name, email, password, role, org_name, user_code, is_active)
                    VALUES (:name, :email, :password, CAST(:role AS user_role), :org_name, :user_code, true)
                """),
                {
                    "name": user_data["name"],
                    "email": user_data["email"],
                    "password": hashed_password,
                    "role": user_data["role"],
                    "org_name": user_data["org_name"],
                    "user_code": user_data["user_code"]
                }
            )
            db_session.commit()
            print(f"  ✓ Created and activated {user_data['role']} user: {user_data['email']}")
            users_created += 1
            
        except Exception as e:
            print(f"  ❌ Failed to process {user_data['email']}. Error: {e}")
            db_session.rollback() 
    
    print(f"\n✅ Database seeding completed! Created {users_created} new, Updated {users_updated} existing.")

def main():
    print("=" * 60)
    print("Trade Finance Blockchain Explorer - Database Seeding")
    print("=" * 60)
    
    force = "--force" in sys.argv or "-f" in sys.argv
    db = SessionLocal()
    
    try:
        seed_users_with_sql(db, force=force)
    except Exception as e:
        print(f"\n❌ Fatal Error during seeding: {str(e)}")
        db.rollback()
    finally:
        db.close()
    
    print("\nSeeding process finished.")

if __name__ == "__main__":
    main()