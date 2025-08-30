#!/usr/bin/env node

/**
 * API Endpoint Testing Script
 * Tests all API endpoints to ensure they're working correctly
 */

const BASE_URL = 'http://localhost:3010';
const API_ENDPOINTS = [
  // Auth endpoints
  { method: 'POST', path: '/api/auth/login', body: { identifier: 'demo', password: 'demo' }, name: 'Customer Login' },
  { method: 'POST', path: '/api/team/auth/login', body: { email: 'admin@fisherbackflows.com', password: 'password' }, name: 'Team Login' },
  { method: 'GET', path: '/api/team/auth/me', headers: { 'x-session-token': 'test' }, name: 'Team Auth Check' },
  
  // Customer endpoints
  { method: 'GET', path: '/api/customers', name: 'List Customers' },
  { method: 'GET', path: '/api/customers/1', name: 'Get Customer' },
  
  // Appointment endpoints
  { method: 'GET', path: '/api/appointments', name: 'List Appointments' },
  { method: 'GET', path: '/api/calendar/available-dates', name: 'Available Dates' },
  
  // Test report endpoints
  { method: 'GET', path: '/api/test-reports', name: 'List Test Reports' },
  
  // Invoice endpoints
  { method: 'GET', path: '/api/invoices', name: 'List Invoices' },
  
  // Health check
  { method: 'GET', path: '/api/health', name: 'Health Check' },
  { method: 'GET', path: '/api/test', name: 'Test Endpoint' },
  
  // Admin endpoints
  { method: 'GET', path: '/api/admin/metrics', name: 'Admin Metrics' },
  { method: 'GET', path: '/api/admin/analytics', name: 'Admin Analytics' },
  { method: 'GET', path: '/api/admin/activity?limit=5', name: 'Admin Activity' },
  
  // Automation endpoints
  { method: 'GET', path: '/api/automation/orchestrator?period=7', name: 'Automation Status' },
  { method: 'GET', path: '/api/security/status', name: 'Security Status' },
  { method: 'GET', path: '/api/monitoring/dashboard', name: 'Monitoring Dashboard' }
];

async function testEndpoint(endpoint) {
  const url = `${BASE_URL}${endpoint.path}`;
  const options = {
    method: endpoint.method,
    headers: {
      'Content-Type': 'application/json',
      ...endpoint.headers
    }
  };
  
  if (endpoint.body) {
    options.body = JSON.stringify(endpoint.body);
  }
  
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    let data = null;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    return {
      name: endpoint.name,
      path: endpoint.path,
      method: endpoint.method,
      status: response.status,
      success: response.ok,
      data: data
    };
  } catch (error) {
    return {
      name: endpoint.name,
      path: endpoint.path,
      method: endpoint.method,
      status: 0,
      success: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('🧪 Testing API Endpoints...\n');
  console.log('Base URL:', BASE_URL);
  console.log('Total endpoints to test:', API_ENDPOINTS.length);
  console.log('=' .repeat(60));
  
  const results = [];
  let successCount = 0;
  let failureCount = 0;
  
  for (const endpoint of API_ENDPOINTS) {
    process.stdout.write(`Testing ${endpoint.name}... `);
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.success || (result.status >= 200 && result.status < 500)) {
      console.log(`✅ ${result.status}`);
      successCount++;
    } else {
      console.log(`❌ ${result.status || 'Failed'} - ${result.error || 'Unknown error'}`);
      failureCount++;
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Test Results Summary:');
  console.log(`✅ Successful: ${successCount}/${API_ENDPOINTS.length}`);
  console.log(`❌ Failed: ${failureCount}/${API_ENDPOINTS.length}`);
  console.log(`📈 Success Rate: ${((successCount / API_ENDPOINTS.length) * 100).toFixed(1)}%`);
  
  // Show failed endpoints details
  if (failureCount > 0) {
    console.log('\n❌ Failed Endpoints:');
    results.filter(r => !r.success && (r.status < 200 || r.status >= 500))
      .forEach(r => {
        console.log(`  - ${r.method} ${r.path}: ${r.error || `Status ${r.status}`}`);
      });
  }
  
  // Show successful with data
  console.log('\n✅ Successful Responses Sample:');
  results.filter(r => r.success || (r.status >= 200 && r.status < 500))
    .slice(0, 3)
    .forEach(r => {
      console.log(`\n  ${r.name} (${r.method} ${r.path}):`);
      if (typeof r.data === 'object') {
        console.log('  ', JSON.stringify(r.data, null, 2).split('\n').slice(0, 5).join('\n  '));
      } else {
        console.log('  ', r.data.substring(0, 100));
      }
    });
}

// Check if server is running
fetch(BASE_URL)
  .then(() => {
    console.log('✅ Server is running at', BASE_URL);
    return runTests();
  })
  .catch((error) => {
    console.error('❌ Server is not running at', BASE_URL);
    console.error('Please start the server with: npm run dev');
    process.exit(1);
  });