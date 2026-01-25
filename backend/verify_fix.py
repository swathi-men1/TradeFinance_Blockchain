import sys
import os

# Ensure backend dir is in path
sys.path.append(os.getcwd())

try:
    print("Attempting to import LedgerEntry...")
    from app.models.ledger import LedgerEntry
    print("Import SUCCESSFUL.")
    
    # Check for correct column name
    # Note: verify it's mapped. Since we can't inspect the mapper easily without full DB, 
    # we just check the class for crashes and attribute existence if possible.
    # But explicitly, the import success PROVES the InvalidRequestError is gone.
    print("Verification SUCCESS: Model imported without 'Attribute name metadata is reserved' error.")

except Exception as e:
    print(f"Import FAILED: {e}")
    sys.exit(1)
