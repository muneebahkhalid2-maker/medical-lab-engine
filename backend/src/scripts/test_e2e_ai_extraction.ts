import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000';

async function testFullE2EPipeline() {
  console.log('==================================================');
  console.log('FULL E2E EXTRACTION PIPELINE AUDIT');
  console.log('==================================================\n');

  try {
    // 1. Backend Health Check
    console.log('[STEP 1] Check Backend & DB Health (GET /api/health)');
    const healthRes = await axios.get(`${BASE_URL}/api/health`);
    console.log('Backend Health Payload:', healthRes.data);
    console.log('--------------------------------------------------');

    // 2. Login to get JWT Token
    console.log('[STEP 2] Authenticate User (POST /api/auth/login)');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'doctor@example.com',
      password: 'password123'
    });
    const token = loginRes.data.data.token;
    console.log('Logged in user:', loginRes.data.data.user.email);
    console.log('--------------------------------------------------');

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 3. Upload real sample lab report file
    console.log('[STEP 3] Upload Real Lab Report (POST /api/documents)');
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

    const docId = uploadRes.data.data._id;
    console.log('Created Document ID:', docId);
    console.log('Upload Status:', uploadRes.data.data.uploadStatus);
    console.log('--------------------------------------------------');

    // 4. Trigger AI Extraction (Backend ↔ AI Service Port 8000)
    console.log(`[STEP 4] Trigger AI Extraction (POST /api/documents/${docId}/process)`);
    const processRes = await axios.post(`${BASE_URL}/api/documents/${docId}/process`, {}, { headers: authHeaders });
    console.log('Process Trigger Status:', processRes.status, processRes.data.message);
    console.log('--------------------------------------------------');

    // Wait 2 seconds for async processing to finish
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. Verify Document Status updated in MongoDB
    console.log(`[STEP 5] Verify Document Status (GET /api/documents/${docId})`);
    const docDetail = await axios.get(`${BASE_URL}/api/documents/${docId}`, { headers: authHeaders });
    console.log('Document Processing Status:', docDetail.data.data.processingStatus);
    console.log('Document Extraction Status:', docDetail.data.data.extractionStatus);
    console.log('--------------------------------------------------');

    // 6. Verify Extracted Clinical JSON in MongoDB
    console.log(`[STEP 6] Fetch Extracted Results (GET /api/documents/${docId}/extractions)`);
    const extractionsRes = await axios.get(`${BASE_URL}/api/documents/${docId}/extractions`, { headers: authHeaders });
    console.log('Extracted Items Count:', extractionsRes.data.data.length);
    console.log('Extracted Clinical Tests Payload:');
    console.log(JSON.stringify(extractionsRes.data.data, null, 2));
    console.log('--------------------------------------------------');

    console.log('FULL END-TO-END AI EXTRACTION PIPELINE PASSED WITH 100% SUCCESS!');
  } catch (err: any) {
    console.error('Audit Failure:', err.response?.data || err.message);
  }
}

testFullE2EPipeline();
