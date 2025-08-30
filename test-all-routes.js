#!/usr/bin/env node

const http = require('http');

const routes = [
  // Public pages
  '/',
  '/login',
  '/maintenance',
  
  // Portal pages
  '/portal',
  '/portal/dashboard',
  '/portal/register',
  '/portal/forgot-password',
  '/portal/reset-password',
  '/portal/billing',
  '/portal/devices',
  '/portal/reports',
  '/portal/schedule',
  '/portal/pay',
  
  // Team Portal pages
  '/team-portal',
  '/team-portal/dashboard',
  '/team-portal/customers',
  '/team-portal/customers/new',
  '/team-portal/customers/database',
  '/team-portal/schedule',
  '/team-portal/schedule/new',
  '/team-portal/invoices',
  '/team-portal/invoices/new',
  '/team-portal/test-report',
  '/team-portal/reminders',
  '/team-portal/reminders/new',
  '/team-portal/district-reports',
  '/team-portal/labels',
  '/team-portal/import',
  '/team-portal/export',
  '/team-portal/backup',
  '/team-portal/settings',
  '/team-portal/help',
  '/team-portal/instagram',
  '/team-portal/more',
  '/team-portal/tester',
  
  // Admin pages
  '/admin',
  '/admin/dashboard',
  '/admin/analytics',
  '/admin/reports',
  '/admin/audit-logs',
  '/admin/data-management',
  '/admin/health',
  '/admin/feedback',
  '/admin/route-optimizer',
  '/admin/search',
  '/admin/site-navigator',
  
  // Field pages
  '/field',
  '/field/login',
  '/field/dashboard',
  
  // App pages
  '/app',
  '/app/dashboard',
  
  // Customer pages
  '/customer/feedback',
  
  // Test pages
  '/test/error-boundaries',
  '/test-navigation',
];

const testRoute = (path) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3010,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      resolve({
        path,
        status: res.statusCode,
        success: res.statusCode < 400
      });
    });

    req.on('error', (err) => {
      resolve({
        path,
        status: 'ERROR',
        success: false,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        path,
        status: 'TIMEOUT',
        success: false
      });
    });

    req.end();
  });
};

async function testAllRoutes() {
  console.log('Testing all routes on http://localhost:3010...\n');
  
  const results = [];
  const chunks = [];
  for (let i = 0; i < routes.length; i += 5) {
    chunks.push(routes.slice(i, i + 5));
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(chunk.map(testRoute));
    results.push(...chunkResults);
  }

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log('\n=== RESULTS ===\n');
  console.log(`✅ Successful: ${successful.length}/${routes.length}`);
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed (${failed.length}):`);
    failed.forEach(r => {
      console.log(`  ${r.path} - Status: ${r.status}${r.error ? ` - Error: ${r.error}` : ''}`);
    });
  }

  // Check for common issues
  const notFound = failed.filter(r => r.status === 404);
  const serverErrors = failed.filter(r => r.status >= 500);
  const authRequired = failed.filter(r => r.status === 401 || r.status === 403);

  if (notFound.length > 0) {
    console.log(`\n📍 404 Not Found (${notFound.length}):`);
    notFound.forEach(r => console.log(`  ${r.path}`));
  }

  if (serverErrors.length > 0) {
    console.log(`\n🔥 Server Errors (${serverErrors.length}):`);
    serverErrors.forEach(r => console.log(`  ${r.path} - Status: ${r.status}`));
  }

  if (authRequired.length > 0) {
    console.log(`\n🔒 Auth Required (${authRequired.length}):`);
    authRequired.forEach(r => console.log(`  ${r.path} - Status: ${r.status}`));
  }

  return failed;
}

testAllRoutes().catch(console.error);