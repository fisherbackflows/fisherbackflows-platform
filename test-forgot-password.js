#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function testForgotPassword() {
  console.log('\n🔐 Testing Forgot Password Functionality\n');
  console.log('='.repeat(60));
  
  const supabaseUrl = 'https://jvhbqfueutvfepsjmztx.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  const testEmail = 'customer@fisherbackflows.com';
  const productionUrl = 'https://www.fisherbackflows.com';
  
  console.log('🧪 Testing password recovery system...');
  console.log(`   Test email: ${testEmail}`);
  console.log('');
  
  try {
    // Test 1: Check if reset password API endpoint works
    console.log('1. Testing password reset API endpoint...');
    try {
      const response = await fetch(`${productionUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail })
      });
      
      const result = await response.json();
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(result, null, 2)}`);
      console.log('');
    } catch (error) {
      console.error(`   ❌ API test failed: ${error.message}`);
      console.log('');
    }
    
    // Test 2: Try Supabase built-in reset password
    console.log('2. Testing Supabase built-in password reset...');
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
        redirectTo: `${productionUrl}/portal/reset-password`
      });
      
      if (error) {
        console.log(`   ❌ Supabase reset failed: ${error.message}`);
      } else {
        console.log('   ✅ Supabase password reset email sent successfully');
        console.log('   📧 Customer should receive reset email');
      }
      console.log('');
    } catch (error) {
      console.error(`   ❌ Supabase reset error: ${error.message}`);
      console.log('');
    }
    
    // Test 3: Check if reset password callback page exists
    console.log('3. Testing password reset callback page...');
    try {
      const response = await fetch(`${productionUrl}/portal/reset-password`);
      console.log(`   Reset callback page status: ${response.status}`);
      
      if (response.status === 404) {
        console.log('   ⚠️  Reset password callback page missing');
      } else {
        console.log('   ✅ Reset password callback page exists');
      }
      console.log('');
    } catch (error) {
      console.error(`   ❌ Callback page test failed: ${error.message}`);
      console.log('');
    }
    
    // Test 4: Manual registration test with different email
    console.log('4. Testing registration with fresh email...');
    const testRegistrationEmail = `test-${Date.now()}@example.com`;
    
    try {
      const response = await fetch(`${productionUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Test',
          lastName: 'User',
          email: testRegistrationEmail,
          phone: '2532788692',
          password: 'TestPassword123!',
          address: {
            street: '123 Test Street',
            city: 'Tacoma',
            state: 'WA',
            zipCode: '98402'
          }
        })
      });
      
      const result = await response.json();
      console.log(`   Registration status: ${response.status}`);
      console.log(`   Registration response: ${JSON.stringify(result, null, 2)}`);
      
      if (response.ok) {
        console.log('   ✅ Registration working properly');
        
        // Clean up test user
        setTimeout(async () => {
          try {
            const { data: users } = await supabase.auth.admin.listUsers();
            const testUser = users.users.find(user => user.email === testRegistrationEmail);
            if (testUser) {
              await supabase.auth.admin.deleteUser(testUser.id);
              console.log('   🧹 Cleaned up test user');
            }
          } catch (cleanupError) {
            console.log('   ⚠️  Cleanup note: Test user may remain in system');
          }
        }, 5000);
      } else {
        console.log('   ❌ Registration has issues');
      }
      console.log('');
    } catch (error) {
      console.error(`   ❌ Registration test failed: ${error.message}`);
      console.log('');
    }
    
    // Test 5: Check Supabase configuration
    console.log('5. Checking Supabase Auth configuration...');
    try {
      const { data: settings, error: settingsError } = await supabase.auth.admin.getSettings();
      
      if (settingsError) {
        console.log(`   ⚠️  Cannot access auth settings: ${settingsError.message}`);
      } else {
        console.log('   ✅ Auth settings accessible');
        console.log(`   External providers enabled: ${JSON.stringify(settings?.external || {}, null, 2)}`);
        console.log(`   Email settings: ${settings?.external?.email ? 'Configured' : 'Not configured'}`);
      }
      console.log('');
    } catch (error) {
      console.log(`   ⚠️  Auth settings check failed: ${error.message}`);
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
  
  console.log('='.repeat(60));
  console.log('🔍 Password Recovery Test: COMPLETE');
  console.log('='.repeat(60));
  console.log('');
  console.log('🎯 KEY FINDINGS:');
  console.log('   • Check the logs above for specific issues');
  console.log('   • Focus on "User not allowed" registration error');
  console.log('   • Verify password recovery flow works end-to-end');
  console.log('   • Ensure reset callback page exists');
  console.log('');
}

testForgotPassword().catch(console.error);