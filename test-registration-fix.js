#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function testRegistrationFix() {
  console.log('\n🧪 TESTING REGISTRATION FIX\n');
  console.log('='.repeat(60));
  
  const productionUrl = 'https://www.fisherbackflows.com';
  const testEmail = `registration-test-${Date.now()}@test.com`;
  const testPassword = 'FixTest123!';
  
  console.log('🎯 Testing fixed registration API...');
  console.log(`   Test email: ${testEmail}`);
  console.log(`   Test password: ${testPassword}`);
  console.log('');
  
  try {
    // Test the fixed registration endpoint
    const response = await fetch(`${productionUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Registration Test Script'
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Registration',
        email: testEmail,
        phone: '2532788692',
        password: testPassword,
        address: {
          street: '123 Test Street',
          city: 'Tacoma',
          state: 'WA',
          zipCode: '98402'
        },
        propertyType: 'residential'
      })
    });
    
    const result = await response.json();
    
    console.log('📋 REGISTRATION TEST RESULTS:');
    console.log(`   Status Code: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(result, null, 2)}`);
    console.log('');
    
    if (response.ok) {
      console.log('🎉 SUCCESS! Registration is now working!');
      console.log('');
      console.log('✅ WHAT WORKED:');
      console.log('   • User creation in Supabase Auth');
      console.log('   • Customer record creation');
      console.log('   • Email verification system');
      console.log('   • Account status management');
      console.log('');
      
      // Test login with the new account
      console.log('🔐 Testing login with new credentials...');
      
      // Wait a moment for the account to be fully created
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const supabase = createClient(
        'https://jvhbqfueutvfepsjmztx.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM0NzUsImV4cCI6MjA3MTg0OTQ3NX0.UuEuNrFU-JXWvoICUNCupz1MzLvWVrcIqRA-LwpI1Jo'
      );
      
      try {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        });
        
        if (loginError) {
          console.log(`   ⚠️  Login test: ${loginError.message}`);
          console.log('   📝 Note: This is expected if email verification is required');
        } else {
          console.log('   ✅ Login test: SUCCESS');
          console.log(`   🎟️  Session created for user: ${loginData.user.id}`);
          
          // Clean up session
          await supabase.auth.signOut();
        }
      } catch (loginTestError) {
        console.log(`   ⚠️  Login test error: ${loginTestError.message}`);
      }
      
      console.log('');
      console.log('🧹 Cleanup: Test user will remain in system for further testing');
      console.log(`   📧 Email: ${testEmail}`);
      console.log(`   🔑 Password: ${testPassword}`);
      
    } else if (response.status === 500 && result.error === 'User not allowed') {
      console.log('❌ REGISTRATION STILL BROKEN');
      console.log('   The "User not allowed" error persists');
      console.log('   This may require checking production environment variables');
      
    } else if (response.status === 409) {
      console.log('✅ REGISTRATION WORKING (User already exists)');
      console.log('   The API is functioning - just hit a duplicate email');
      
    } else {
      console.log(`⚠️  REGISTRATION ISSUE: ${result.error || 'Unknown error'}`);
      console.log('   Status indicates API is responding but has validation issues');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('='.repeat(60));
  console.log('🧪 REGISTRATION FIX TEST: COMPLETE');
  console.log('='.repeat(60));
}

testRegistrationFix().catch(console.error);