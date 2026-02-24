
import requests
import sys
import time

BASE_URL = "http://127.0.0.1:8001"

def test_signup():
    print("Testing Signup...")
    url = f"{BASE_URL}/auth/signup"
    data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "password123",
        "organization": "Test Org",
        "role": "corporate"
    }
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            print("Signup Successful")
            return True
        elif response.status_code == 400 and "Email already registered" in response.text:
             print("User already exists, proceeding to login.")
             return True
        else:
            print(f"Signup Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Signup Exception: {e}")
        return False

def test_login():
    print("Testing Login...")
    url = f"{BASE_URL}/auth/login"
    data = {
        "email": "test@example.com",
        "password": "password123"
    }
    try:
        session = requests.Session()
        response = session.post(url, json=data)
        if response.status_code == 200:
            print("Login Successful")
            # Check if cookie is set
            if 'tradechain_session' in session.cookies:
                 print("Session cookie found.")
            else:
                 print("WARNING: Session cookie NOT found in session.")
            
            # Test /me
            print("Testing /me endpoint...")
            me_response = session.get(f"{BASE_URL}/auth/me")
            if me_response.status_code == 200:
                print("/me Successful")
                print(me_response.json())
            else:
                 print(f"/me Failed: {me_response.status_code} - {me_response.text}")
                 return False

            # Test /debug-session
            print("Testing /debug-session...")
            debug_res = session.get(f"{BASE_URL}/auth/debug-session")
            print(f"Debug Session: {debug_res.status_code}")
            print(debug_res.text)

            # Test /documents/my-documents (Dashboard Load)
            print("Testing /documents/my-documents...")
            docs_res = session.get(f"{BASE_URL}/documents/my-documents")
            if docs_res.status_code == 200:
                print("Dashboard Documents Load Successful")
                return True
            else:
                print(f"Dashboard Documents Load Failed: {docs_res.status_code} - {docs_res.text}")
                return False

        else:
            print(f"Login Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Login Exception: {e}")
        return False

if __name__ == "__main__":
    # Wait for server to start if needed
    # time.sleep(1) 
    
    if test_signup():
        test_login()
