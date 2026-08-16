import requests
import json
import os

url = "http://127.0.0.1:8000/api/v1/extract"
file_path = r"C:\Users\USER\.gemini\antigravity-ide\scratch\medical_lab_engine\backend\uploads\1786899555837-359057710.jpeg"
doc_id = "6a81ec6360b6ab00f96ce1dd"

if not os.path.exists(file_path):
    print(f"File not found: {file_path}")
    exit(1)

payload = {
    "file_path": file_path,
    "doc_id": doc_id
}

headers = {
    "Content-Type": "application/json"
}

print(f"Sending extraction request for file: {file_path}")
response = requests.post(url, json=payload, headers=headers)

print(f"Response Status Code: {response.status_code}")
print("Response Structured JSON:")
print(json.dumps(response.json(), indent=2))
