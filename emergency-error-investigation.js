#!/usr/bin/env node

async function emergencyErrorInvestigation() {
  console.log('\n🚨 EMERGENCY ERROR INVESTIGATION\n');
  console.log('='.repeat(70));
  console.log('Error ID: err_1756956103362_hmvctoe65');
  console.log('Status: Middleware fix deployed but error persists');
  console.log('');
  
  const productionUrl = 'https://www.fisherbackflows.com';
  
  console.log('🔍 SYSTEMATIC ERROR ANALYSIS:');
  console.log('');
  
  // Test 1: Check if it's a specific route issue
  console.log('1. ROUTE-SPECIFIC ERROR TESTING:');
  const criticalRoutes = [
    { path: '/', name: 'Homepage' },
    { path: '/portal', name: 'Customer Portal Login' },
    { path: '/portal/dashboard', name: 'Customer Dashboard' },
    { path: '/team-portal', name: 'Team Portal' },
    { path: '/api/health', name: 'API Health Check' }
  ];
  
  for (const route of criticalRoutes) {
    try {
      const response = await fetch(`${productionUrl}${route.path}`, {
        headers: {
          'User-Agent': 'Emergency Investigation',
          'Accept': 'text/html,application/json,*/*'
        }
      });
      
      let hasError = false;
      let responsePreview = '';
      
      try {
        const text = await response.text();
        hasError = text.includes('Oops! Something went wrong') || text.includes('Error ID');
        responsePreview = text.substring(0, 150);
      } catch (parseError) {
        responsePreview = 'Could not parse response';
      }
      
      const status = hasError ? '🚨 ERROR' : response.status >= 400 ? '⚠️ ISSUE' : '✅ OK';
      console.log(`   ${status} ${route.name}: ${response.status}`);
      
      if (hasError) {
        console.log(`      🔍 Error detected in response`);
        console.log(`      📄 Preview: ${responsePreview}...`);
      }
    } catch (error) {
      console.log(`   ❌ ${route.name}: Connection failed - ${error.message}`);
    }
  }
  
  console.log('');
  
  // Test 2: Check middleware processing
  console.log('2. MIDDLEWARE PROCESSING TEST:');
  try {
    const testResponse = await fetch(`${productionUrl}/portal/dashboard`, {
      headers: {
        'X-Test-Request': 'middleware-investigation',
        'User-Agent': 'Middleware Test'
      }
    });
    
    console.log(`   Dashboard route status: ${testResponse.status}`);
    console.log(`   Response headers:`, [...testResponse.headers.entries()].slice(0, 3));
    
    const responseText = await testResponse.text();
    if (responseText.includes('Oops! Something went wrong')) {
      console.log('   🚨 Dashboard route showing error page');
      
      // Look for error ID in response
      const errorMatch = responseText.match(/Error ID for support:\s*(\w+)/);
      if (errorMatch) {
        console.log(`   📋 Error ID found: ${errorMatch[1]}`);
      }
    } else {
      console.log('   ✅ Dashboard route not showing error page');
    }
  } catch (middlewareError) {
    console.log(`   ❌ Middleware test failed: ${middlewareError.message}`);
  }
  
  console.log('');
  
  // Test 3: API endpoints specifically
  console.log('3. API ENDPOINT ERROR TESTING:');
  const apiEndpoints = [
    '/api/health',
    '/api/auth/login',
    '/api/auth/register'
  ];
  
  for (const endpoint of apiEndpoints) {
    try {
      const method = endpoint.includes('login') || endpoint.includes('register') ? 'POST' : 'GET';
      const body = method === 'POST' ? JSON.stringify({ test: true }) : undefined;
      
      const response = await fetch(`${productionUrl}${endpoint}`, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
        body
      });
      
      console.log(`   ${endpoint}: ${response.status} ${response.statusText}`);
      
      if (response.status >= 500) {
        console.log(`      🚨 Server error detected`);
      }
    } catch (apiError) {
      console.log(`   ❌ ${endpoint}: ${apiError.message}`);
    }
  }
  
  console.log('');
  
  // Test 4: Check if it's deployment-related
  console.log('4. DEPLOYMENT STATUS CHECK:');
  try {
    const healthResponse = await fetch(`${productionUrl}/api/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   ✅ API Health check working');
      console.log(`   📊 Environment: ${healthData.environment}`);
      console.log(`   🔧 Version: ${healthData.version}`);
      console.log(`   ⏰ Timestamp: ${healthData.timestamp}`);
    } else {
      console.log(`   ❌ Health check failed: ${healthResponse.status}`);
    }
  } catch (healthError) {
    console.log(`   ❌ Health check error: ${healthError.message}`);
  }
  
  console.log('');
  console.log('🎯 ERROR PATTERN ANALYSIS:');
  console.log('');
  
  console.log('POSSIBLE CAUSES:');
  console.log('1. 🔧 COMPONENT ERROR:');
  console.log('   • Specific React component throwing server-side error');
  console.log('   • Dashboard component has data fetching issue');
  console.log('   • Missing environment variable in component');
  console.log('');
  console.log('2. 🗄️ DATABASE ERROR:');
  console.log('   • Supabase connection failing');
  console.log('   • RLS policy blocking data access');
  console.log('   • Missing customer data causing render error');
  console.log('');
  console.log('3. 🏗️ BUILD/DEPLOYMENT ERROR:');
  console.log('   • Recent deployment introduced breaking change');
  console.log('   • Environment variables not propagated correctly');
  console.log('   • Next.js build cache issue');
  console.log('');
  console.log('4. 🔐 AUTHENTICATION ERROR:');
  console.log('   • Session handling broken in components');
  console.log('   • Auth state causing component crashes');
  console.log('   • Cookie/session configuration issue');
  console.log('');
  
  console.log('🛠️ IMMEDIATE NEXT STEPS:');
  console.log('1. Check Vercel deployment logs for specific error details');
  console.log('2. Temporarily disable middleware to isolate issue');
  console.log('3. Test with simpler redirect (redirect to /portal instead of /portal/dashboard)');
  console.log('4. Check if customer data exists and is accessible');
  
  console.log('\n' + '='.repeat(70));
  console.log('🚨 EMERGENCY ERROR INVESTIGATION: COMPLETE');
  console.log('='.repeat(70));
}

emergencyErrorInvestigation().catch(console.error);