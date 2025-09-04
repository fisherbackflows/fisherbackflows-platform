#!/usr/bin/env node

async function investigateProductionError() {
  console.log('\n🚨 INVESTIGATING PRODUCTION ERROR\n');
  console.log('='.repeat(60));
  console.log('Error ID: err_1756955113713_iy68r9dep');
  console.log('');
  
  const productionUrl = 'https://www.fisherbackflows.com';
  
  console.log('🔍 Testing various production endpoints...');
  console.log('');
  
  const testEndpoints = [
    { path: '/', name: 'Homepage' },
    { path: '/portal', name: 'Customer Portal Login' },
    { path: '/portal/dashboard', name: 'Customer Dashboard' },
    { path: '/team-portal', name: 'Team Portal' },
    { path: '/api/health', name: 'API Health Check' },
    { path: '/api/auth/register', name: 'Registration API', method: 'GET' }
  ];
  
  for (const endpoint of testEndpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      
      const response = await fetch(`${productionUrl}${endpoint.path}`, {
        method: endpoint.method || 'GET',
        headers: {
          'User-Agent': 'Error Investigation Script',
          'Accept': 'text/html,application/json,*/*'
        }
      });
      
      const contentType = response.headers.get('content-type');
      let responseText = '';
      
      try {
        if (contentType?.includes('application/json')) {
          const json = await response.json();
          responseText = JSON.stringify(json, null, 2);
        } else {
          responseText = await response.text();
        }
      } catch (parseError) {
        responseText = 'Could not parse response';
      }
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Content-Type: ${contentType}`);
      
      // Check for error patterns
      if (responseText.includes('Oops! Something went wrong')) {
        console.log('   🚨 ERROR FOUND: "Oops! Something went wrong"');
        console.log('   📝 This is a generic error page');
      } else if (responseText.includes('Error ID')) {
        console.log('   🚨 ERROR FOUND: Error ID present in response');
      } else if (response.status >= 500) {
        console.log('   🚨 SERVER ERROR: 5xx status code');
      } else if (response.status >= 400) {
        console.log('   ⚠️  CLIENT ERROR: 4xx status code');
      } else {
        console.log('   ✅ WORKING: No obvious errors detected');
      }
      
      // Show partial response for debugging
      if (responseText.length > 0) {
        const preview = responseText.substring(0, 200);
        console.log(`   Preview: ${preview}${responseText.length > 200 ? '...' : ''}`);
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ CONNECTION ERROR: ${error.message}`);
      console.log('');
    }
  }
  
  console.log('🔍 Additional checks...');
  console.log('');
  
  // Check if it's a specific page or global issue
  console.log('Testing different user paths...');
  
  const userJourneys = [
    { name: 'New visitor to homepage', path: '/' },
    { name: 'Existing customer to portal', path: '/portal' },
    { name: 'Registration attempt', path: '/portal/register' }
  ];
  
  for (const journey of userJourneys) {
    try {
      const response = await fetch(`${productionUrl}${journey.path}`);
      const hasError = response.status >= 400;
      console.log(`   ${journey.name}: ${hasError ? '❌ ERROR' : '✅ OK'} (${response.status})`);
    } catch (error) {
      console.log(`   ${journey.name}: ❌ FAILED (${error.message})`);
    }
  }
  
  console.log('');
  console.log('🎯 LIKELY CAUSES OF PRODUCTION ERROR:');
  console.log('');
  console.log('1. 🏗️  DEPLOYMENT ISSUE:');
  console.log('   • Recent deployment may have introduced a bug');
  console.log('   • Environment variables missing in production');
  console.log('   • Build process failed partially');
  console.log('');
  console.log('2. 🔑 CONFIGURATION ISSUE:');
  console.log('   • Supabase keys not properly set in Vercel');
  console.log('   • Resend API key missing in production environment');
  console.log('   • Database connection issues');
  console.log('');
  console.log('3. 🔄 TEMPORARY ISSUE:');
  console.log('   • Vercel platform experiencing issues');
  console.log('   • CDN or DNS propagation delays');
  console.log('   • Temporary network connectivity problems');
  console.log('');
  console.log('🛠️  RECOMMENDED IMMEDIATE ACTIONS:');
  console.log('');
  console.log('1. Check Vercel deployment logs');
  console.log('2. Verify all environment variables are set');
  console.log('3. Test a fresh deployment');
  console.log('4. Check if error occurs on specific pages or globally');
  console.log('');
  
  console.log('='.repeat(60));
  console.log('🚨 PRODUCTION ERROR INVESTIGATION: COMPLETE');
  console.log('='.repeat(60));
}

investigateProductionError().catch(console.error);