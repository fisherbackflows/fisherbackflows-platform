const axios = require('axios');

async function testAllAPIs() {
  console.log('🔍 Comprehensive API Endpoint Testing\n');
  
  let sessionCookie = '';
  
  try {
    // Login first to get auth
    console.log('🔐 Authenticating...');
    const loginResponse = await axios.post('http://localhost:3010/api/team/auth/login', {
      email: 'admin@fisherbackflows.com',
      password: 'admin'
    });
    sessionCookie = loginResponse.headers['set-cookie']?.[0] || '';
    console.log('✅ Authenticated as admin\n');
    
    // Define all endpoints to test
    const endpoints = [
      // Working endpoints
      { method: 'GET', url: '/api/health', name: 'Health Check', needsAuth: false },
      { method: 'GET', url: '/api/test', name: 'Test Endpoint', needsAuth: false },
      { method: 'GET', url: '/api/customers', name: 'Customers API', needsAuth: true },
      { method: 'GET', url: '/api/invoices', name: 'Invoices API', needsAuth: false },
      { method: 'GET', url: '/api/calendar/available-dates', name: 'Available Dates', needsAuth: false },
      
      // Potentially problematic endpoints from analysis
      { method: 'GET', url: '/api/leads/generate', name: 'Leads Generation', needsAuth: true },
      { method: 'GET', url: '/api/automation/email', name: 'Email Automation', needsAuth: true },
      { method: 'GET', url: '/api/security/status', name: 'Security Status', needsAuth: true },
      { method: 'GET', url: '/api/monitoring/dashboard', name: 'Monitoring Dashboard', needsAuth: true },
      
      // Other business endpoints
      { method: 'GET', url: '/api/appointments', name: 'Appointments', needsAuth: true },
      { method: 'GET', url: '/api/test-reports', name: 'Test Reports', needsAuth: true }
    ];
    
    const results = [];
    
    console.log('📡 Testing Endpoints:\n');
    
    for (const endpoint of endpoints) {
      try {
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (endpoint.needsAuth && sessionCookie) {
          headers['Cookie'] = sessionCookie;
        }
        
        const response = await axios({
          method: endpoint.method,
          url: `http://localhost:3010${endpoint.url}`,
          headers,
          timeout: 5000
        });
        
        console.log(`✅ ${endpoint.name}: ${response.status} OK`);
        results.push({ ...endpoint, status: response.status, result: 'SUCCESS' });
        
      } catch (error) {
        if (error.response) {
          const status = error.response.status;
          const message = error.response.data?.error || error.response.data?.message || 'Unknown error';
          
          if (status === 401) {
            console.log(`🔐 ${endpoint.name}: ${status} (Auth Required)`);
            results.push({ ...endpoint, status, result: 'AUTH_REQUIRED' });
          } else if (status === 403) {
            console.log(`🚫 ${endpoint.name}: ${status} (Forbidden)`);
            results.push({ ...endpoint, status, result: 'FORBIDDEN', error: message });
          } else if (status === 404) {
            console.log(`❓ ${endpoint.name}: ${status} (Not Found)`);
            results.push({ ...endpoint, status, result: 'NOT_FOUND' });
          } else if (status === 405) {
            console.log(`❌ ${endpoint.name}: ${status} (Method Not Allowed)`);
            results.push({ ...endpoint, status, result: 'METHOD_NOT_ALLOWED', error: message });
          } else if (status >= 500) {
            console.log(`💥 ${endpoint.name}: ${status} (Server Error) - ${message}`);
            results.push({ ...endpoint, status, result: 'SERVER_ERROR', error: message });
          } else {
            console.log(`⚠️  ${endpoint.name}: ${status} - ${message}`);
            results.push({ ...endpoint, status, result: 'ERROR', error: message });
          }
        } else {
          console.log(`🔌 ${endpoint.name}: Network Error - ${error.message}`);
          results.push({ ...endpoint, status: 'N/A', result: 'NETWORK_ERROR', error: error.message });
        }
      }
    }
    
    // Summary
    console.log('\n📊 TEST SUMMARY:');
    console.log('================');
    
    const successful = results.filter(r => r.result === 'SUCCESS').length;
    const failed = results.filter(r => ['SERVER_ERROR', 'METHOD_NOT_ALLOWED', 'ERROR'].includes(r.result));
    const authIssues = results.filter(r => ['FORBIDDEN', 'AUTH_REQUIRED'].includes(r.result)).length;
    
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`🔐 Auth Issues: ${authIssues}`);
    
    if (failed.length > 0) {
      console.log('\n🚨 FAILING ENDPOINTS:');
      failed.forEach(endpoint => {
        console.log(`   - ${endpoint.name} (${endpoint.method} ${endpoint.url})`);
        console.log(`     Status: ${endpoint.status}`);
        console.log(`     Error: ${endpoint.error}`);
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

testAllAPIs();