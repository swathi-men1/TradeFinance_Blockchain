from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "postgresql+psycopg2://neondb_owner:npg_EuLMjqp3QB1P@ep-noisy-term-af5jwmo1-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require"

engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=300)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# ✅ ADD THIS (VERY IMPORTANT)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
