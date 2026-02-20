#!/usr/bin/env python
"""Fetch and display all users with their passwords (hashed) from the database"""
from app.db.session import engine
from sqlalchemy import text

try:
    with engine.connect() as connection:
        # Query users with passwords using raw SQL
        result = connection.execute(text("""
            SELECT id, user_code, name, email, password, role, org_name, is_active, created_at
            FROM users
            ORDER BY id
        """))
        
        rows = result.fetchall()
        
        if not rows:
            print("No users found in the database.")
        else:
            print("\n" + "=" * 180)
            print(f"{'ID':<5} {'User Code':<12} {'Name':<25} {'Email':<35} {'Password Hash':<60} {'Role':<12}")
            print("=" * 180)
            
            for row in rows:
                id_val = row[0] if row[0] is not None else '-'
                code_val = row[1] if row[1] is not None else '-'
                name_val = row[2] if row[2] is not None else '-'
                email_val = row[3] if row[3] is not None else '-'
                password_val = row[4] if row[4] is not None else '-'
                role_val = row[5] if row[5] is not None else '-'
                
                # Truncate long password hash for display
                password_display = password_val[:50] + "..." if len(str(password_val)) > 50 else str(password_val)
                print(f"{id_val:<5} {code_val:<12} {name_val:<25} {email_val:<35} {password_display:<60} {role_val:<12}")
            
            print("=" * 180)
            print(f"\nTotal Users: {len(rows)}")
            
            # Print detailed info with full password hash
            print("\n" + "=" * 180)
            print("DETAILED USER INFORMATION WITH PASSWORD HASHES")
            print("=" * 180)
            for i, row in enumerate(rows, 1):
                print(f"\n{i}. User ID: {row[0]}")
                print(f"   User Code: {row[1]}")
                print(f"   Name: {row[2]}")
                print(f"   Email: {row[3]}")
                print(f"   Password Hash: {row[4]}")
                print(f"   Role: {row[5]}")
                print(f"   Organization: {row[6]}")
                print(f"   Active: {row[7]}")
                print(f"   Created At: {row[8]}")

except Exception as e:
    print(f"Error: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
