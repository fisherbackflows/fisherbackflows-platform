#!/usr/bin/env node

const http = require('http');

const routes = [
  // Public pages
  { path: '/', expected: [200] },
  { path: '/login', expected: [200] },
  { path: '/maintenance', expected: [200] },
  
  // Portal pages
  { path: '/portal', expected: [200] },
  { path: '/portal/dashboard', expected: [200] },
  { path: '/portal/register', expected: [200] },
  { path: '/portal/forgot-password', expected: [200] },
  { path: '/portal/reset-password', expected: [200] },
  { path: '/portal/billing', expected: [200] },
  { path: '/portal/devices', expected: [200] },
  { path: '/portal/reports', expected: [200] },
  { path: '/portal/schedule', expected: [200] },
  { path: '/portal/pay', expected: [200] },
  
  // Team Portal pages (may require auth or redirect to login)
  { path: '/team-portal', expected: [200, 302, 307] },
  { path: '/team-portal/login', expected: [200] },
  { path: '/team-portal/dashboard', expected: [200, 302, 307] },
  { path: '/team-portal/customers', expected: [200, 302, 307] },
  { path: '/team-portal/customers/new', expected: [200, 302, 307] },
  { path: '/team-portal/schedule', expected: [200, 302, 307] },
  { path: '/team-portal/invoices', expected: [200, 302, 307] },
  { path: '/team-portal/test-report', expected: [200, 302, 307] },
  { path: '/team-portal/settings', expected: [200, 302, 307] },
  
  // Admin pages (will redirect without auth)
  { path: '/admin', expected: [307] },
  { path: '/admin/dashboard', expected: [200, 302, 307] },
  { path: '/admin/analytics', expected: [200, 302, 307] },
  { path: '/admin/reports', expected: [200, 302, 307] },
  { path: '/admin/health', expected: [200, 302, 307] },
  
  // Field pages
  { path: '/field', expected: [200] },
  { path: '/field/login', expected: [200] },
  { path: '/field/dashboard', expected: [200] },
  
  // App pages (redirect to team-portal)
  { path: '/app', expected: [200, 307] },
  
  // Customer pages (redirect to portal)
  { path: '/customer', expected: [307] },
  { path: '/customer/feedback', expected: [200] },
  
  // Test pages
  { path: '/test-navigation', expected: [200] },
  
  // These should return 404
  { path: '/nonexistent', expected: [404] },
  { path: '/fake-route', expected: [404] },
];

const testRoute = (path) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3010,
      path: path,
      method: 'GET',
      timeout: 10000,
      headers: {
        'Accept': 'text/html,application/xhtml+xml'
      }
    };

    const req = http.request(options, (res) => {
      resolve({
        path,
        status: res.statusCode,
        location: res.headers.location
      });
    });

    req.on('error', (err) => {
      resolve({
        path,
        status: 'ERROR',
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        path,
        status: 'TIMEOUT'
      });
    });

    req.end();
  });
};

async function testAllRoutes() {
  console.log('🔍 Testing all routes on http://localhost:3010...\n');
  
  const results = [];
  
  // Test in batches to avoid overwhelming the server
  for (let i = 0; i < routes.length; i += 3) {
    const batch = routes.slice(i, i + 3);
    const batchPromises = batch.map(route => 
      testRoute(route.path).then(result => ({
        ...result,
        expected: route.expected,
        success: route.expected.includes(result.status)
      }))
    );
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log('\n=== RESULTS ===\n');
  console.log(`✅ Passing: ${successful.length}/${routes.length}`);
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed (${failed.length}):`);
    failed.forEach(r => {
      console.log(`  ${r.path}`);
      console.log(`    Expected: ${r.expected.join(' or ')}`);
      console.log(`    Got: ${r.status}${r.location ? ` (redirects to ${r.location})` : ''}`);
    });
  } else {
    console.log('\n🎉 All routes are working correctly!');
  }

  // Summary by status code
  const statusCounts = {};
  results.forEach(r => {
    if (typeof r.status === 'number') {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    }
  });

  console.log('\n📊 Status Code Summary:');
  Object.entries(statusCounts).sort().forEach(([status, count]) => {
    const label = 
      status === '200' ? '✅ OK' :
      status === '307' ? '↪️ Redirect' :
      status === '302' ? '↪️ Redirect' :
      status === '404' ? '❌ Not Found' :
      status >= '500' ? '🔥 Server Error' :
      '❓ Other';
    console.log(`  ${status} ${label}: ${count}`);
  });

  return failed.length === 0;
}

testAllRoutes()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(console.error);