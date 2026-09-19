import urllib.request
import json
import os

boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
with open('backend/uploads/1786899555837-359057710.jpeg', 'rb') as f:
    img_data = f.read()

part_header = f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="sample_angiography.jpeg"\r\nContent-Type: image/jpeg\r\n\r\n'.encode('utf-8')
part_footer = f'\r\n--{boundary}--\r\n'.encode('utf-8')
body = part_header + img_data + part_footer

upload_req = urllib.request.Request(
    'http://localhost:5000/api/documents/upload',
    data=body,
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
)

try:
    res = urllib.request.urlopen(upload_req)
    doc_resp = json.loads(res.read().decode())
    print('1. Upload status:', doc_resp.get('success'))
    doc_id = doc_resp.get('data', {}).get('id')
    print('2. Uploaded Document ID:', doc_id)

    extract_req = urllib.request.Request(
        f'http://localhost:5000/api/documents/{doc_id}/extract',
        data=b'{}',
        headers={'Content-Type': 'application/json'}
    )
    extract_res = urllib.request.urlopen(extract_req)
    extracted = json.loads(extract_res.read().decode())
    print('3. Extraction status:', extracted.get('success'))
    data = extracted.get('data', {})
    print('4. Patient Demographics:')
    print('   Name:  ', data.get('patient_info', {}).get('patient_name'))
    print('   Age:   ', data.get('patient_info', {}).get('age'))
    print('   Gender:', data.get('patient_info', {}).get('gender'))
    print('   Date:  ', data.get('patient_info', {}).get('report_date'))
    print('5. Extracted Test/Finding Parameters:')
    for t in data.get('tests', []):
        print(f"   [{t.get('status')}] {t.get('testName')}: {t.get('result')}")
except urllib.error.HTTPError as he:
    print('HTTP Error:', he.code, he.reason)
    print('Error Body:', he.read().decode())
except Exception as e:
    print('End-to-end test error:', e)
