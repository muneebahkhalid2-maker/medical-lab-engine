import axios from 'axios';

async function testAllRoutesWithAuth() {
  console.log('--- TESTING ALL BACKEND API ENDPOINTS WITH AUTH TOKEN ---');
  
  let token = '';
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'doctor@example.com',
      password: 'password123'
    });
    token = loginRes.data?.data?.token;
    console.log('[AUTH] Login successful. JWT token received.');
  } catch (err: any) {
    console.error('[AUTH FAIL]', err.message);
  }

  const headers = { Authorization: `Bearer ${token}` };

  const endpoints = [
    { name: 'Health Check', url: 'http://localhost:5000/api/health', auth: false },
    { name: 'Patients List', url: 'http://localhost:5000/api/patients', auth: true },
    { name: 'Audit Logs', url: 'http://localhost:5000/api/audit-logs', auth: true },
    { name: 'Documents List', url: 'http://localhost:5000/api/documents', auth: true },
    { name: 'Analysis Results', url: 'http://localhost:5000/api/analysis', auth: true }
  ];

  for (const ep of endpoints) {
    try {
      const res = await axios.get(ep.url, { headers: ep.auth ? headers : {} });
      console.log(`[PASS] ${ep.name} (${ep.url}) - Status: ${res.status}`);
      console.log(`       Data Keys/Length:`, Array.isArray(res.data?.data) ? `Array of ${res.data.data.length} items` : JSON.stringify(res.data));
    } catch (err: any) {
      console.error(`[FAIL] ${ep.name} (${ep.url}) - Status: ${err.response?.status || 'ERR'} (${err.message})`);
    }
  }
}

testAllRoutesWithAuth();
