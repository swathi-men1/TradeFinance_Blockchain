import requests
import json

BASE_URL = "http://localhost:8001"

def test_my_documents():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})

    # 1. Login (assuming user exists from previous steps, or we might need to signup)
    # Since DB was reset, we should try signup first, then login.
    import random
    email = f"test_corp_{random.randint(1000,9999)}@example.com"
    password = "password123"
    
    print(f"Attempting Signup/Login for {email}...")
    
    signup_data = {
        "name": "Test Corp V2",
        "email": email,
        "password": password,
        "role": "corporate",
        "organization": "Test Org"
    }
    
    # Try Signup
    res = session.post(f"{BASE_URL}/auth/signup", json=signup_data)
    print(f"Signup Status: {res.status_code}")
    print(f"Signup Response: {res.text}")
    
    if res.status_code == 200:
        print("Signup Successful")
    elif res.status_code == 400:
        print("User likely already exists, proceeding to login.")
    else:
        print(f"Signup Failed: {res.status_code} - {res.text}")
        # Dont return, try login anyway just in case


    # Login
    login_data = {"email": email, "password": password}
    res = session.post(f"{BASE_URL}/auth/login", json=login_data)
    if res.status_code == 200:
        print("Login Successful")
    else:
        print(f"Login Failed: {res.status_code} - {res.text}")
        return

    # 2. Call my-documents
    print("Calling /documents/my-documents...")
    res = session.get(f"{BASE_URL}/documents/my-documents")
    
    if res.status_code == 200:
        print("SUCCESS! Documents retrieved:")
        print(json.dumps(res.json(), indent=2))
    else:
        print(f"FAILURE: {res.status_code}")
        print(res.text)

if __name__ == "__main__":
    test_my_documents()
