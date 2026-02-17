#!/usr/bin/env python3
"""
Seed script to populate test data for Trade Finance Blockchain
Run: python seed_data.py from backend directory
"""

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.organization import Organization
from app.models.trade_transaction import TradeTransaction
from app.models.document import Document
from app.utils.security import hash_password
import uuid

def create_seed_data():
    """Create all test data"""
    db = SessionLocal()
    
    try:
        # Clear existing data (optional - comment out for production)
        print("Creating tables...")
        Base.metadata.create_all(bind=engine)
        
        # ============================================================
        # CREATE ORGANIZATIONS
        # ============================================================
        print("Creating organizations...")
        
        orgs = [
            Organization(
                name="Global Bank Corp",
                org_type="bank"
            ),
            Organization(
                name="Tech Enterprises Ltd",
                org_type="corporate"
            ),
            Organization(
                name="Audit Professionals Inc",
                org_type="auditor"
            ),
            Organization(
                name="System Admins Group",
                org_type="admin"
            ),
        ]
        
        for org in orgs:
            existing = db.query(Organization).filter(Organization.name == org.name).first()
            if not existing:
                db.add(org)
        
        db.commit()
        orgs_dict = {org.name: org for org in db.query(Organization).all()}
        
        # ============================================================
        # CREATE USERS
        # ============================================================
        print("Creating users...")
        
        users_data = [
            {
                "email": "bank@globalbank.com",
                "password": "password123",
                "role": "bank",
                "org": "Global Bank Corp"
            },
            {
                "email": "corporate@techent.com",
                "password": "password123",
                "role": "corporate",
                "org": "Tech Enterprises Ltd"
            },
            {
                "email": "auditor@auditorpro.com",
                "password": "password123",
                "role": "auditor",
                "org": "Audit Professionals Inc"
            },
            {
                "email": "admin@sysadmin.com",
                "password": "password123",
                "role": "admin",
                "org": "System Admins Group"
            },
        ]
        
        users_dict = {}
        for user_data in users_data:
            existing = db.query(User).filter(User.email == user_data["email"]).first()
            if not existing:
                org = orgs_dict[user_data["org"]]
                user = User(
                    email=user_data["email"],
                    hashed_password=hash_password(user_data["password"]),
                    role=user_data["role"],
                    org_id=org.id
                )
                db.add(user)
                db.flush()
                users_dict[user_data["email"]] = user
            else:
                users_dict[user_data["email"]] = existing
        
        db.commit()
        users_list = list(db.query(User).all())
        
        # ============================================================
        # CREATE TEST TRADES
        # ============================================================
        print("Creating test trades...")
        
        if len(users_list) >= 2:
            bank_user = next((u for u in users_list if u.role == "bank"), None)
            corporate_user = next((u for u in users_list if u.role == "corporate"), None)
            
            if bank_user and corporate_user:
                trades_data = [
                    {
                        "initiator_id": bank_user.id,
                        "counterparty_id": corporate_user.id,
                        "amount": 50000.00,
                        "currency": "USD",
                        "status": "pending",
                        "is_tampered": True
                    },
                    {
                        "initiator_id": bank_user.id,
                        "counterparty_id": corporate_user.id,
                        "amount": 75000.00,
                        "currency": "EUR",
                        "status": "approved",
                        "is_tampered": False
                    },
                    {
                        "initiator_id": corporate_user.id,
                        "counterparty_id": bank_user.id,
                        "amount": 100000.00,
                        "currency": "GBP",
                        "status": "pending",
                        "is_tampered": False
                    },
                ]
                
                for trade_data in trades_data:
                    trade = TradeTransaction(**trade_data)
                    db.add(trade)
                
                db.commit()
        
        print("\n✅ Seed data created successfully!\n")
        print("Test Credentials:")
        print("==================")
        for user_data in users_data:
            print(f"  {user_data['role'].upper()}:")
            print(f"    Email: {user_data['email']}")
            print(f"    Password: {user_data['password']}")
            print()
        
    except Exception as e:
        print(f"❌ Error creating seed data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_seed_data()
