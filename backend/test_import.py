
import sys
import os

# Add current directory to sys.path
sys.path.append(os.getcwd())

try:
    print("Attempting to import app...")
    from app import app
    print("Successfully imported app.")
except Exception as e:
    print(f"Failed to import app: {e}")
    import traceback
    traceback.print_exc()
