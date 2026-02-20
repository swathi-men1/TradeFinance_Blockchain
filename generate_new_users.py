#!/usr/bin/env python3
"""
Generate fresh user credentials for DocChain application
"""
import sys
import os
import io
import random
import string
from datetime import datetime

# Fix Windows encoding for special characters
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from sqlalchemy import text
from app.db.session import engine, SessionLocal  # type: ignore
from app.db.base import Base  # type: ignore
from app.core.security import hash_password  # type: ignore
from app.models.user import User, UserRole  # type: ignore

def generate_password(length=12):
    """Generate a random password with letters, numbers, and symbols"""
    characters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(random.choice(characters) for _ in range(length))

def reset_and_create_users():
    """Reset database and create fresh users"""
    print("\n" + "="*60)
    print("DocChain - Database User Recreation")
    print("="*60 + "\n")
    
    db = SessionLocal()
    
    try:
        # Drop all tables with CASCADE
        print("[*] Dropping existing tables...")
        with engine.connect() as connection:
            connection.execute(text("DROP TABLE IF EXISTS audit_logs CASCADE"))
            connection.execute(text("DROP TABLE IF EXISTS compromise_attempts CASCADE"))
            connection.execute(text("DROP TABLE IF EXISTS integrity_reports CASCADE"))
            connection.execute(text("DROP TABLE IF EXISTS compliance_alerts CASCADE"))
            connection.execute(text("DROP TABLE IF EXISTS risk_scores CASCADE"))
            connection.execute(text("DROP TABLE IF EXISTS trade_documents CASCADE"))
            connection.execute(text("DROP TABLE IF EXISTS ledger_entries CASCADE"))
            connection.execute(text("DROP TABLE IF EXISTS trade_transactions CASCADE"))
            connection.execute(text("DROP TABLE IF EXISTS documents CASCADE"))
            connection.execute(text("DROP TABLE IF EXISTS users CASCADE"))
            connection.execute(text("DROP TABLE IF EXISTS organizations CASCADE"))
            connection.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE"))
            connection.commit()
        print("[OK] All tables dropped\n")
        
        # Recreate schema
        print("[*] Recreating database schema...")
        Base.metadata.create_all(bind=engine)
        print("[OK] Schema recreated\n")
        
        # Define user data
        users_data = [
            {
                'user_code': 'SYS' + str(random.randint(100, 999)),
                'name': 'System Admin',
                'email': 'admin@docchain.com',
                'role': UserRole.ADMIN,
                'org_name': 'DocChain Corp'
            },
            {
                'user_code': 'BAN' + str(random.randint(100, 999)),
                'name': 'Bank User',
                'email': 'bank@docchain.com',
                'role': UserRole.BANK,
                'org_name': 'Global Bank'
            },
            {
                'user_code': 'COR' + str(random.randint(100, 999)),
                'name': 'Corporate User',
                'email': 'corporate@docchain.com',
                'role': UserRole.CORPORATE,
                'org_name': 'Trade Corp'
            },
            {
                'user_code': 'AUD' + str(random.randint(100, 999)),
                'name': 'Auditor User',
                'email': 'auditor@docchain.com',
                'role': UserRole.AUDITOR,
                'org_name': 'Audit Firm'
            }
        ]
        
        # Create users
        print("[*] Creating new user accounts...\n")
        created_users = []
        
        for user_data in users_data:
            password = generate_password()
            user = User(
                user_code=user_data['user_code'],
                name=user_data['name'],
                email=user_data['email'],
                password=hash_password(password),
                role=user_data['role'],
                org_name=user_data['org_name'],
                is_active=True
            )
            db.add(user)
            created_users.append({
                **user_data,
                'password': password,
                'user_code': user.user_code if hasattr(user, 'user_code') else user_data['user_code']
            })
        
        db.commit()
        print("[OK] Users created successfully\n")
        
        # Display credentials
        print("="*80)
        print("NEW USER CREDENTIALS - SAVE THESE IN A SECURE LOCATION")
        print("="*80 + "\n")
        
        print(f"{'#':<3} {'User Code':<8} {'Name':<18} {'Email':<30} {'Password':<20}")
        print("-" * 80)
        
        for i, user in enumerate(created_users, 1):
            print(f"{i:<3} {user['user_code']:<8} {user['name']:<18} {user['email']:<30} {user['password']:<20}")
        
        print("\n" + "="*80)
        print("DETAILED CREDENTIALS")
        print("="*80 + "\n")
        
        for user in created_users:
            print(f"Role: {user['role'].value.upper()}")
            print(f"  Email:    {user['email']}")
            print(f"  Password: {user['password']}")
            print()
        
        print("="*80 + "\n")
        
        return created_users
        
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == '__main__':
    users = reset_and_create_users()
    print("\n[SUCCESS] Database reset and users created!\n")
