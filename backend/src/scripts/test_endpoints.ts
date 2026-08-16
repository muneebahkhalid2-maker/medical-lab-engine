import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

async function runFullAuthenticatedAudit() {
  console.log('==================================================');
  console.log('AUTHENTICATED BACKEND API INTEGRATION TEST SUITE');
  console.log('==================================================\n');

  try {
    // 1. Health Check
    console.log('[TEST 1] GET /api/health');
    const healthRes = await axios.get(`${BASE_URL}/api/health`);
    console.log(`Status: ${healthRes.status} | Data:`, healthRes.data);
    console.log('--------------------------------------------------');

    // 2. Register / Login
    console.log('[TEST 2] POST /api/auth/login');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'doctor@example.com',
      password: 'password123'
    });
    console.log(`Status: ${loginRes.status} | Data:`, loginRes.data);
    const token = loginRes.data.data.token;
    console.log('--------------------------------------------------');

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 3. GET /api/auth/me
    console.log('[TEST 3] GET /api/auth/me');
    const meRes = await axios.get(`${BASE_URL}/api/auth/me`, { headers: authHeaders });
    console.log(`Status: ${meRes.status} | Data:`, meRes.data);
    console.log('--------------------------------------------------');

    // 4. GET /api/documents (Authenticated)
    console.log('[TEST 4] GET /api/documents (Authenticated)');
    const docsRes = await axios.get(`${BASE_URL}/api/documents`, { headers: authHeaders });
    console.log(`Status: ${docsRes.status} | Data:`, docsRes.data);
    console.log('--------------------------------------------------');

    // 5. POST /api/upload Validation
    console.log('[TEST 5] POST /api/upload Validation');
    try {
      await axios.post(`${BASE_URL}/api/upload`, {});
    } catch (err: any) {
      if (err.response) {
        console.log(`Status: ${err.response.status} | Data:`, err.response.data);
      }
    }
    console.log('--------------------------------------------------');

  } catch (err: any) {
    console.error('Audit Error:', err.response?.data || err.message);
  }
}

runFullAuthenticatedAudit();
