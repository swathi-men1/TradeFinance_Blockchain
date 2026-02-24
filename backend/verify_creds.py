from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.user import User
import hashlib

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

DATABASE_URL = "sqlite:///./tradechain_v2.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

user = db.query(User).filter(User.email == "admin@trade.com").first()
if user:
    print(f"User found: {user.email}")
    print(f"Stored Hash: {user.password}")
    print(f"Hash of 'password123': {hash_password('password123')}")
    if user.password == hash_password('password123'):
        print("Password Match!")
    else:
        print("Password Mismatch!")
else:
    print("User 'test@trade.com' not found.")
db.close()
