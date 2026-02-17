import requests
import json

# Test the document upload endpoint
print("Testing document upload endpoint...")

# Get token
login_response = requests.post('http://localhost:8000/auth/login', 
    data={
        'username': 'corporate@techent.com',
        'password': 'password123'
    }
)

print(f"1. Login response: {login_response.status_code}")
if login_response.status_code == 200:
    token = login_response.json()['access_token']
    print(f"   Token obtained: {token[:20]}...")
    
    headers = {'Authorization': f'Bearer {token}'}
    files = {'file': ('test.txt', b'This is a test document')}
    
    # Try without trailing slash
    print("\n2. Testing /documents/upload (no trailing slash):")
    try:
        resp = requests.post('http://localhost:8000/documents/upload', 
            files=files, 
            headers=headers,
            allow_redirects=False
        )
        print(f"   Status: {resp.status_code}")
        if resp.status_code in [301, 302, 307, 308]:
            print(f"   Redirect to: {resp.headers.get('Location')}")
        print(f"   Response: {resp.text[:150]}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Try with trailing slash
    print("\n3. Testing /documents/upload/ (with trailing slash):")
    try:
        resp2 = requests.post('http://localhost:8000/documents/upload/', 
            files=files, 
            headers=headers
        )
        print(f"   Status: {resp2.status_code}")
        print(f"   Response: {resp2.text[:150]}")
    except Exception as e:
        print(f"   Error: {e}")
else:
    print(f"   Error: {login_response.text}")
