import urllib.request
import json
import sys

# 1. Login
login_url = "http://localhost:8000/api/auth/login"
data = json.dumps({
    "email": "admin@tarifaia.com",
    "password": "admin1234"
}).encode("utf-8")

req = urllib.request.Request(
    login_url,
    data=data,
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req) as response:
        res_data = json.loads(response.read().decode("utf-8"))
        token = res_data.get("access_token")
        print("Login successful! Token acquired.")
except Exception as e:
    if hasattr(e, "read"):
        print("Login failed with details:", e.read().decode("utf-8"))
    else:
        print("Failed to login:", e)
    sys.exit(1)

# 2. Get download endpoint
download_url = "http://localhost:8000/api/documentos/1/plantilla/descargar"
req_download = urllib.request.Request(
    download_url,
    headers={"Authorization": f"Bearer {token}"}
)

try:
    with urllib.request.urlopen(req_download) as response:
        content = response.read()
        print("Download successful! Status code: 200")
        print("Content length:", len(content))
        print("Headers:", dict(response.info()))
except urllib.error.HTTPError as e:
    print("Download failed with HTTPError:", e.code)
    print("Response text:", e.read().decode("utf-8", errors="ignore"))
except Exception as e:
    print("Download failed:", e)
