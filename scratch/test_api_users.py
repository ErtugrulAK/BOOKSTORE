import requests

login_url = "http://localhost:5229/api/auth/login"
users_url = "http://localhost:5229/api/Users"

login_payload = {
    "Username": "admin",
    "Password": "1234"
}

try:
    # 1. Login
    r_login = requests.post(login_url, json=login_payload)
    if r_login.status_code != 200:
        print("Login failed:", r_login.status_code, r_login.text)
        exit(1)
        
    data = r_login.json()
    token = data["token"]
    print("Login successful! User info:", data["user"])
    
    # 2. Get Users
    headers = {
        "Authorization": f"Bearer {token}"
    }
    r_users = requests.get(users_url, headers=headers)
    print("Get Users Status:", r_users.status_code)
    print("Get Users Response:", r_users.json())
except Exception as e:
    print("Error:", e)
