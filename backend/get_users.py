#!/usr/bin/env python
"""Fetch and display all users from the database using raw SQL"""
from app.db.session import engine
from sqlalchemy import text

try:
    with engine.connect() as connection:
        # Query users using raw SQL
        result = connection.execute(text("""
            SELECT id, user_code, name, email, role, org_name, is_active, created_at
            FROM users
            ORDER BY id
        """))
        
        rows = result.fetchall()
        
        if not rows:
            print("No users found in the database.")
        else:
            print("\n" + "=" * 140)
            print(f"{'ID':<5} {'User Code':<12} {'Name':<25} {'Email':<35} {'Role':<12} {'Organization':<20} {'Active':<8} {'Created At':<20}")
            print("=" * 140)
            
            for row in rows:
                id_val = row[0] if row[0] is not None else '-'
                code_val = row[1] if row[1] is not None else '-'
                name_val = row[2] if row[2] is not None else '-'
                email_val = row[3] if row[3] is not None else '-'
                role_val = row[4] if row[4] is not None else '-'
                org_val = row[5] if row[5] is not None else '-'
                active_val = str(row[6]) if row[6] is not None else '-'
                created_val = str(row[7]) if row[7] is not None else '-'
                print(f"{id_val:<5} {code_val:<12} {name_val:<25} {email_val:<35} {role_val:<12} {org_val:<20} {active_val:<8} {created_val:<20}")
            
            print("=" * 140)
            print(f"\nTotal Users: {len(rows)}")
            
            # Print detailed info
            print("\n" + "=" * 140)
            print("DETAILED USER INFORMATION")
            print("=" * 140)
            for i, row in enumerate(rows, 1):
                print(f"\n{i}. User ID: {row[0]}")
                print(f"   User Code: {row[1]}")
                print(f"   Name: {row[2]}")
                print(f"   Email: {row[3]}")
                print(f"   Role: {row[4]}")
                print(f"   Organization: {row[5]}")
                print(f"   Active: {row[6]}")
                print(f"   Created At: {row[7]}")

except Exception as e:
    print(f"Error: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
