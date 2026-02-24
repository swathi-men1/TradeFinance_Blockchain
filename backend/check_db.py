import hashlib
import sys
import os

# Add the project root to sys.path so we can import internal modules
sys.path.append(os.getcwd())

from database.init_db import SessionLocal, Base, engine
from models.user import User

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def check_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Total users: {len(users)}")
        for u in users:
            print(f"ID: {u.id}, Email: {u.email}, Name: {u.name}, Role: {u.role}")
        
        # Add a default admin if none exists
        if not any(u.email == "admin@trade.com" for u in users):
            print("Creating default admin: admin@trade.com / password123")
            admin = User(
                name="System Admin",
                email="admin@trade.com",
                password=hash_password("password123"),
                role="admin",
                organization="TradeChain Hub"
            )
            db.add(admin)
            db.commit()
            print("Admin created.")
            
    except Exception as e:
        print(f"Error checking users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_users()
