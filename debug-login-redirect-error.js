#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function debugLoginRedirectError() {
  console.log('\n🚨 DEBUGGING LOGIN REDIRECT ERROR\n');
  console.log('='.repeat(70));
  console.log('Error ID: err_1756955710276_9qk0b1hkj');
  console.log('Issue: Login successful → Redirecting → Error page');
  console.log('');
  
  const productionUrl = 'https://www.fisherbackflows.com';
  const supabaseUrl = 'https://jvhbqfueutvfepsjmztx.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM0NzUsImV4cCI6MjA3MTg0OTQ3NX0.UuEuNrFU-JXWvoICUNCupz1MzLvWVrcIqRA-LwpI1Jo';
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log('🔍 DIAGNOSTIC STEPS:');
  console.log('');
  
  try {
    // Step 1: Check the dashboard route directly
    console.log('1. Testing dashboard route directly...');
    try {
      const dashResponse = await fetch(`${productionUrl}/portal/dashboard`);
      const dashText = await dashResponse.text();
      
      console.log(`   Status: ${dashResponse.status}`);
      console.log(`   Content-Type: ${dashResponse.headers.get('content-type')}`);
      
      if (dashText.includes('Oops! Something went wrong')) {
        console.log('   🚨 ERROR: Dashboard page showing error');
      } else if (dashText.includes('Error ID')) {
        console.log('   🚨 ERROR: Error ID found in dashboard response');
      } else {
        console.log('   ✅ Dashboard page loads without obvious errors');
      }
      
      console.log(`   Response preview: ${dashText.substring(0, 200)}...`);
    } catch (dashError) {
      console.log(`   ❌ Dashboard test failed: ${dashError.message}`);
    }
    
    console.log('');
    
    // Step 2: Test login flow programmatically
    console.log('2. Testing login flow programmatically...');
    try {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'customer@fisherbackflows.com',
        password: 'Knvgtch6r91!'
      });
      
      if (loginError) {
        console.log(`   ❌ Login failed: ${loginError.message}`);
      } else if (loginData.user) {
        console.log('   ✅ Login successful programmatically');
        console.log(`   User ID: ${loginData.user.id}`);
        console.log(`   Email: ${loginData.user.email}`);
        console.log(`   Email confirmed: ${loginData.user.email_confirmed_at ? 'Yes' : 'No'}`);
        
        // Clean up
        await supabase.auth.signOut();
      }
    } catch (loginTestError) {
      console.log(`   ❌ Login test error: ${loginTestError.message}`);
    }
    
    console.log('');
    
    // Step 3: Check various portal routes
    console.log('3. Testing portal routes...');
    const portalRoutes = [
      '/portal',
      '/portal/dashboard', 
      '/portal/billing',
      '/portal/devices'
    ];
    
    for (const route of portalRoutes) {
      try {
        const response = await fetch(`${productionUrl}${route}`);
        const hasError = response.status >= 500 || response.status === 404;
        const statusIcon = hasError ? '❌' : response.status >= 400 ? '⚠️' : '✅';
        console.log(`   ${statusIcon} ${route}: ${response.status} ${response.statusText}`);
      } catch (routeError) {
        console.log(`   ❌ ${route}: Connection error`);
      }
    }
    
    console.log('');
    
    // Step 4: Check if it's a middleware/auth issue
    console.log('4. Checking authentication middleware...');
    try {
      // Test with a request that includes auth headers
      const response = await fetch(`${productionUrl}/portal/dashboard`, {
        headers: {
          'Authorization': 'Bearer test-token',
          'Cookie': 'sb-access-token=test'
        }
      });
      
      console.log(`   Dashboard with auth headers: ${response.status}`);
    } catch (authError) {
      console.log(`   Auth test error: ${authError.message}`);
    }
    
    console.log('');
    
    // Step 5: Check API health
    console.log('5. Checking API health...');
    try {
      const healthResponse = await fetch(`${productionUrl}/api/health`);
      const healthData = await healthResponse.json();
      
      console.log(`   API Health: ${healthResponse.status}`);
      console.log(`   Health data: ${JSON.stringify(healthData, null, 2)}`);
    } catch (healthError) {
      console.log(`   Health check failed: ${healthError.message}`);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
  
  console.log('\n🎯 LIKELY CAUSES:');
  console.log('');
  console.log('1. 🔐 AUTHENTICATION MIDDLEWARE ISSUE:');
  console.log('   • Login succeeds but dashboard requires different auth');
  console.log('   • Session not being set correctly after login');
  console.log('   • Middleware rejecting authenticated requests');
  console.log('');
  console.log('2. 🏗️ DASHBOARD COMPONENT ERROR:');
  console.log('   • Dashboard page has a server-side rendering error');
  console.log('   • Missing environment variables in dashboard');
  console.log('   • Database query failing in dashboard component');
  console.log('');
  console.log('3. 🔄 ROUTING ISSUE:');
  console.log('   • redirectTo="/portal/dashboard" pointing to broken route');
  console.log('   • Infinite redirect loop');
  console.log('   • Next.js routing configuration problem');
  console.log('');
  console.log('🛠️ IMMEDIATE ACTIONS NEEDED:');
  console.log('');
  console.log('1. Check the dashboard page component for errors');
  console.log('2. Verify authentication middleware is working correctly');
  console.log('3. Test redirect destination in LoginForm component');
  console.log('4. Check production logs in Vercel dashboard');
  console.log('');
  
  console.log('='.repeat(70));
  console.log('🚨 LOGIN REDIRECT ERROR DEBUG: COMPLETE');
  console.log('='.repeat(70));
}

debugLoginRedirectError().catch(console.error);