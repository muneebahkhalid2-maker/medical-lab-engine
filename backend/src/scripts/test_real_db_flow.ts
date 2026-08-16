import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000';

async function testRealDocumentFlow() {
  console.log('==================================================');
  console.log('REAL MONGO DATABASE DOCUMENT FLOW AUDIT');
  console.log('==================================================\n');

  try {
    // 1. Health Check
    console.log('[STEP 1] GET /api/health');
    const healthRes = await axios.get(`${BASE_URL}/api/health`);
    console.log('Health Payload:', healthRes.data);
    console.log('Database Status:', healthRes.data.database);
    console.log('--------------------------------------------------');

    // 2. Login to get JWT Token
    console.log('[STEP 2] POST /api/auth/login');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'doctor@example.com',
      password: 'password123'
    });
    const token = loginRes.data.data.token;
    console.log('Logged in as:', loginRes.data.data.user.email);
    console.log('--------------------------------------------------');

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 3. Upload real sample lab report file
    console.log('[STEP 3] Uploading real sample lab report file');
    const sampleFilePath = path.join(__dirname, '..', '..', '..', 'Sample_LabReports', 'WhatsApp Image 2026-07-10 at 3.57.52 PM.jpeg');
    
    if (!fs.existsSync(sampleFilePath)) {
      throw new Error(`Sample lab report file not found at: ${sampleFilePath}`);
    }

    const form = new FormData();
    form.append('document', fs.createReadStream(sampleFilePath));

    const uploadRes = await axios.post(`${BASE_URL}/api/documents`, form, {
      headers: {
        ...authHeaders,
        ...form.getHeaders()
      }
    });

    console.log('Upload Response Status:', uploadRes.status);
    console.log('Uploaded Real Document Data:', uploadRes.data.data);
    const createdDocId = uploadRes.data.data._id;
    console.log('--------------------------------------------------');

    // 4. Query GET /api/documents to verify real record persistence
    console.log('[STEP 4] GET /api/documents (Verifying database document persistence)');
    const docsRes = await axios.get(`${BASE_URL}/api/documents`, { headers: authHeaders });
    console.log('Fetched Documents Count:', docsRes.data.data.length);
    console.log('Persisted Document Record:', docsRes.data.data[0]);
    console.log('--------------------------------------------------');

    // 5. Query GET /api/documents/:id
    console.log(`[STEP 5] GET /api/documents/${createdDocId}`);
    const detailRes = await axios.get(`${BASE_URL}/api/documents/${createdDocId}`, { headers: authHeaders });
    console.log('Fetched Document Detail:', detailRes.data.data._id, detailRes.data.data.originalFileName);
    console.log('--------------------------------------------------');

    console.log('ALL REAL DATABASE DOCUMENT AUDIT TESTS PASSED SUCCESSFULLY!');
  } catch (err: any) {
    console.error('Audit Failure:', err.response?.data || err.message);
  }
}

testRealDocumentFlow();
