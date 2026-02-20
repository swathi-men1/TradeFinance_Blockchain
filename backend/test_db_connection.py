#!/usr/bin/env python
"""Test database connection"""
from app.config import settings
from app.db.session import engine
from sqlalchemy import text

try:
    with engine.connect() as connection:
        result = connection.execute(text('SELECT 1'))
        print('✓ Database connection SUCCESSFUL')
        db_url = settings.DATABASE_URL
        # Extract the important parts
        if '@' in db_url:
            host_part = db_url.split('@')[1]
            user_part = db_url.split('://')[1].split(':')[0]
            print(f'✓ Connected as: {user_part}')
            print(f'✓ Host: {host_part}')
        print(f'✓ Full URL: {db_url}')
except Exception as e:
    print(f'✗ Database connection FAILED')
    print(f'✗ Error: {type(e).__name__}: {str(e)}')
    import traceback
    traceback.print_exc()
