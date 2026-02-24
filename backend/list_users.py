from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.user import User
import os

DATABASE_URL = "sqlite:///./tradechain_v2.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

users = db.query(User).all()
if not users:
    print("--- NO USERS FOUND ---")
else:
    print(f"--- FOUND {len(users)} USERS ---")
    for u in users:
        print(f"ID: {u.id} | Email: '{u.email}' | Role: {u.role}")
db.close()
