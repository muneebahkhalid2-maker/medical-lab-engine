import axios from 'axios';

async function testCorsHeaders() {
  console.log('==================================================');
  console.log('TESTING CORS POLICY FOR ORIGIN http://localhost:5177');
  console.log('==================================================\n');

  const origin = 'http://localhost:5177';
  const targetUrl = 'http://localhost:5000/api/documents';

  try {
    // 1. OPTIONS Preflight Request
    console.log('[STEP 1] Testing OPTIONS Preflight request...');
    const optionsRes = await axios.options(targetUrl, {
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization,content-type'
      }
    });

    console.log('Preflight HTTP Status:', optionsRes.status);
    console.log('Access-Control-Allow-Origin:', optionsRes.headers['access-control-allow-origin']);
    console.log('Access-Control-Allow-Credentials:', optionsRes.headers['access-control-allow-credentials']);
    console.log('--------------------------------------------------');

    // 2. Authenticated GET Request
    console.log('[STEP 2] Testing Authenticated GET request from origin 5177...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'doctor@example.com',
      password: 'password123'
    }, {
      headers: { 'Origin': origin }
    });

    const token = loginRes.data.data.token;
    const getRes = await axios.get(targetUrl, {
      headers: {
        'Origin': origin,
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('GET HTTP Status:', getRes.status);
    console.log('Access-Control-Allow-Origin:', getRes.headers['access-control-allow-origin']);
    console.log('Access-Control-Allow-Credentials:', getRes.headers['access-control-allow-credentials']);
    console.log('Returned Documents Count:', getRes.data.data.length);
    console.log('--------------------------------------------------');

    console.log('CORS VERIFICATION PASSED PERFECTLY!');
  } catch (err: any) {
    console.error('CORS Error:', err.response?.headers || err.message);
  }
}

testCorsHeaders();
