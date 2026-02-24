import requests

API_BASE = "http://127.0.0.1:8001"
session = requests.Session()

# 1. Check current status
print("Checking current status...")
r = session.get(f"{API_BASE}/auth/me")
print(f"Status: {r.status_code}, Body: {r.json()}")

# 2. Login
print("\nAttempting login...")
login_payload = {
    "email": "test@trade.com",
    "password": "password123"
}
r = session.post(f"{API_BASE}/auth/login", json=login_payload)
print(f"Status: {r.status_code}, Body: {r.json()}")
print(f"Cookies: {session.cookies.get_dict()}")

# 3. Check status again
print("\nChecking status after login...")
r = session.get(f"{API_BASE}/auth/me")
print(f"Status: {r.status_code}, Body: {r.json()}")
print(f"Cookies: {session.cookies.get_dict()}")
