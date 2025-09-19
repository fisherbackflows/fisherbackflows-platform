// Test production login flow
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

async function testProductionLogin() {
  console.log('🔍 TESTING PRODUCTION LOGIN FLOW\n');
  
  const baseUrl = 'https://www.fisherbackflows.com';
  const testEmail = 'test.customer.fixed@example.com';
  const testPassword = 'TestPassword123';
  
  try {
    console.log('1. TESTING PRODUCTION LOGIN API:');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: testEmail,
        password: testPassword,
        type: 'email'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.error('❌ Production login failed:', loginData);
      return;
    }
    
    console.log('✅ Production login API succeeded');
    console.log(`   User ID: ${loginData.user?.id}`);
    console.log(`   Name: ${loginData.user?.name}`);
    console.log(`   Redirect: ${loginData.redirect}`);
    console.log(`   Session provided: ${!!loginData.session}`);
    
    if (loginData.session) {
      console.log(`   Access token length: ${loginData.session.access_token?.length}`);
      console.log(`   Refresh token length: ${loginData.session.refresh_token?.length}`);
    }
    
    console.log('\n2. VERIFYING CUSTOMER DATA IN DATABASE:');
    const supabase = createClient(
      'https://jvhbqfueutvfepsjmztx.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Verify customer exists with correct auth_user_id
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', testEmail)
      .single();
      
    if (customerError) {
      console.error('❌ Customer lookup failed:', customerError.message);
      return;
    }
    
    console.log('✅ Customer found in database');
    console.log(`   Customer ID: ${customer.id}`);
    console.log(`   Name: ${customer.first_name} ${customer.last_name}`);
    console.log(`   Auth User ID: ${customer.auth_user_id}`);
    
    console.log('\n3. TESTING DASHBOARD API ACCESS:');
    
    // Simulate what useCustomerData hook would do
    const authClient = createClient(
      'https://jvhbqfueutvfepsjmztx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM0NzQsImV4cCI6MjA3MTg0OTQ3NH0.xjmN_3J4qLlCx4uT97CNXZP7YfPG0PnhFE4cMjWRTmc'
    );
    
    // Set session as the client would
    const { error: sessionError } = await authClient.auth.setSession({
      access_token: loginData.session.access_token,
      refresh_token: loginData.session.refresh_token,
    });
    
    if (sessionError) {
      console.error('❌ Failed to set session:', sessionError.message);
      return;
    }
    
    console.log('✅ Session set successfully');
    
    // Test getting current user
    const { data: { user }, error: userError } = await authClient.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Failed to get user from session:', userError?.message);
      return;
    }
    
    console.log('✅ User retrieved from session');
    console.log(`   User ID: ${user.id}`);
    
    // Test customer lookup as useCustomerData would do
    const { data: dashboardCustomer, error: dashboardError } = await authClient
      .from('customers')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();
      
    if (dashboardError || !dashboardCustomer) {
      console.error('❌ Dashboard customer lookup failed:', dashboardError?.message);
      return;
    }
    
    console.log('✅ Dashboard customer lookup succeeded');
    console.log(`   Customer: ${dashboardCustomer.first_name} ${dashboardCustomer.last_name}`);
    
    console.log('\n4. TESTING DEVICES LOOKUP:');
    const { data: devices, error: devicesError } = await authClient
      .from('devices')
      .select('*')
      .eq('customer_id', dashboardCustomer.id);
      
    console.log(devicesError ? `❌ Devices query failed: ${devicesError.message}` : `✅ Devices query succeeded (${devices?.length || 0} devices)`);
    
    console.log('\n🎯 PRODUCTION LOGIN FLOW TEST RESULT:');
    console.log('✅ Login API works correctly');
    console.log('✅ Session tokens are valid');
    console.log('✅ Customer data is accessible');
    console.log('✅ Dashboard should load successfully');
    console.log('\nIf dashboard still doesn\'t redirect properly, the issue is likely:');
    console.log('- Browser session storage issues');
    console.log('- Client-side React component state issues');
    console.log('- Timing issues with redirect after session setting');
    
  } catch (error) {
    console.error('❌ Production test failed:', error.message);
  }
}

testProductionLogin();