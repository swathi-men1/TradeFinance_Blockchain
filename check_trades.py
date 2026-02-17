import requests

def get_trades(username, password):
    s = requests.Session()
    r = s.post('http://localhost:8000/auth/login', data={'username': username, 'password': password})
    print(f'Login {username}:', r.status_code)
    if r.status_code!=200:
        print(r.text)
        return
    token = r.json().get('access_token')
    headers = {'Authorization': f'Bearer {token}'}
    r2 = s.get('http://localhost:8000/trades/', headers=headers)
    print(f'GET /trades/ as {username}:', r2.status_code)
    try:
        print(r2.json())
    except Exception as e:
        print(r2.text)

if __name__=='__main__':
    get_trades('corporate@techent.com','password123')
    get_trades('bank@globalbank.com','password123')
