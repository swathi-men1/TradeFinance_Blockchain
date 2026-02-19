# Project: Trade Finance Blockchain Explorer | Developer: Abdul Samad | FRS Standard Compliance
"""
Database seeding script for Trade Finance Blockchain Explorer
Creates test users for different roles: Admin, Corporate, Bank, Auditor

Usage:
    # Run inside Docker container:
    docker-compose exec backend python seed_database.py
"""

import sys
import os
import random
import string
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from app.db.session import SessionLocal
from app.core.security import hash_password


def seed_users_with_sql(db_session, force: bool = False):
    """Seed users using raw SQL to avoid enum type issues"""
    
    # Define test users with NEW credentials
    test_users = [
        {
            "name": "System Administrator",
            "email": "admin@tradefinance.com",
            # New password
            "password": "AdminSecure2026!", 
            "role": "admin",
            "org_name": "Trade Finance Platform"
        },
        {
            "name": "Corporate User",
            "email": "corporate@company.com",
            "password": "CorpSecure2026!",
            "role": "corporate",
            "org_name": "Acme Corporation"
        },
        {
            "name": "Banking Officer",
            "email": "bank@globalbank.com",
            "password": "BankSecure2026!",
            "role": "bank",
            "org_name": "Global Bank Ltd"
        },
        {
            "name": "Risk Auditor",
            "email": "auditor@auditfirm.com",
            "password": "AuditSecure2026!",
            "role": "auditor",
            "org_name": "Independent Audit Services"
        }
    ]
    
    print("Checking existing users...")
    # Clean slate approach as requested by user ("replace existing one")
    print("🧹 Clearing existing users to enforce new credentials...")
    db_session.execute(text("DELETE FROM users"))
    db_session.commit()
    print("   Users table cleared.")

    print("\nCreating new test users...")
    users_created = 0
    
    for index, user_data in enumerate(test_users, 1):
        # Hash the password
        hashed_password = hash_password(user_data["password"])
        
        # Standardized Protocol for User Codes
        # Constraint: Database column is VARCHAR(10)
        # Format: AS26-XX-Y (e.g., AS26-AD-1) -> 9-10 chars
        # Or: AS26ADM001 -> 10 chars (Removing hyphens)
        
        role_map = {
            "admin": "ADM",
            "corporate": "CRP",
            "bank": "BNK",
            "auditor": "AUD"
        }
        role_code = role_map.get(user_data["role"], "USR")
        year = "26" # Shortened year
        seq = f"{index:01d}" # Single digit if possible, or 2
        
        # AS26-ADM-1 (10 chars exactly for single digit seq)
        # If seq > 9, it breaks. 
        # Safer: AS26ADM001 (10 chars)
        seq = f"{index:03d}"
        user_code = f"AS{year}{role_code}{seq}"
        
        print(f"   Generated User Code: {user_code} (Len: {len(user_code)})")
        
        # Insert using raw SQL
        db_session.execute(
            text("""
                INSERT INTO users (user_code, name, email, password, role, org_name, is_active)
                VALUES (:user_code, :name, :email, :password, CAST(:role AS user_role), :org_name, true)
            """),
            {
                "user_code": user_code,
                "name": user_data["name"],
                "email": user_data["email"],
                "password": hashed_password,
                "role": user_data["role"],
                "org_name": user_data["org_name"]
            }
        )
        print(f"  ✓ Created {user_data['role']} user: {user_data['email']} (Code: {user_code})")
        users_created += 1
    
    if users_created > 0:
        db_session.commit()
        print(f"\n✅ Database seeding completed! Created {users_created} new user(s).")
    else:
        print(f"\n✅ All test users already exist. No changes made.")


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
