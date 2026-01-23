"""
Database connection and initialization module.
This handles PostgreSQL auto-connection and table auto-creation.
"""

import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker, declarative_base
import time

# Database configuration
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "tradefin_chaindb")

# Connection string
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# SQLAlchemy setup
engine = None
SessionLocal = None
Base = declarative_base()


def get_database_url_admin():
    """Return connection string for admin/default database."""
    return f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/postgres"


def init_database():
    """
    Initialize database connection and create tables if they don't exist.
    This function handles:
    1. Creating the database if it doesn't exist
    2. Creating all tables
    3. Inserting dummy data
    """
    global engine, SessionLocal
    
    print("\n" + "="*70)
    print("🔧 INITIALIZING DATABASE CONNECTION")
    print("="*70)
    
    # Step 1: Try to connect to the default postgres database to create our DB
    print(f"📍 Step 1: Attempting to connect to PostgreSQL at {DB_HOST}:{DB_PORT}")
    print(f"   User: {DB_USER}")
    
    admin_url = get_database_url_admin()
    
    try:
        admin_engine = create_engine(admin_url)
        with admin_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            conn.commit()
        print("✅ Connected to PostgreSQL successfully!")
    except OperationalError as e:
        print(f"❌ FAILED to connect to PostgreSQL:")
        print(f"   Error: {str(e)}")
        print(f"\n⚠️  IMPORTANT: Please ensure PostgreSQL is running!")
        print(f"   Connection details:")
        print(f"   - Host: {DB_HOST}")
        print(f"   - Port: {DB_PORT}")
        print(f"   - User: {DB_USER}")
        print(f"   - Password: {DB_PASSWORD}")
        raise
    
    # Step 2: Create database if it doesn't exist
    print(f"\n📍 Step 2: Creating database '{DB_NAME}' if it doesn't exist...")
    try:
        with admin_engine.connect() as conn:
            # Check if database exists
            result = conn.execute(
                text(f"SELECT 1 FROM pg_database WHERE datname = '{DB_NAME}'")
            )
            db_exists = result.fetchone() is not None
            
            if db_exists:
                print(f"✅ Database '{DB_NAME}' already exists")
            else:
                print(f"   Creating database '{DB_NAME}'...")
                # Terminate existing connections
                conn.execute(
                    text(f"""
                    SELECT pg_terminate_backend(pg_stat_activity.pid)
                    FROM pg_stat_activity
                    WHERE pg_stat_activity.datname = '{DB_NAME}'
                    AND pid <> pg_backend_pid()
                    """)
                )
                conn.execute(text(f"CREATE DATABASE {DB_NAME}"))
                conn.commit()
                print(f"✅ Database '{DB_NAME}' created successfully!")
        
        admin_engine.dispose()
    except Exception as e:
        print(f"❌ Error creating database: {str(e)}")
        raise
    
    # Step 3: Create engine for our database
    print(f"\n📍 Step 3: Connecting to '{DB_NAME}' database...")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            conn.commit()
        print(f"✅ Connected to database '{DB_NAME}' successfully!")
    except OperationalError as e:
        print(f"❌ Failed to connect to {DB_NAME}: {str(e)}")
        raise
    
    # Step 4: Create session maker
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    print(f"✅ Session factory created")
    
    # Step 5: Create tables
    print(f"\n📍 Step 4: Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print(f"✅ Tables created successfully!")
        
        # List created tables
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        if tables:
            print(f"   Tables in database: {', '.join(tables)}")
        else:
            print(f"   ℹ️  No tables yet (will be created when models are imported)")
    except Exception as e:
        print(f"❌ Error creating tables: {str(e)}")
        raise
    
    print("\n" + "="*70)
    print("✅ DATABASE INITIALIZATION COMPLETE")
    print("="*70 + "\n")
    
    return engine, SessionLocal


def get_db():
    """Dependency injection for database sessions in FastAPI routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
