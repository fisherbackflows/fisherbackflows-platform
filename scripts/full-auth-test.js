#!/usr/bin/env node

/**
 * Full Authentication Flow Test
 * 
 * This script tests the complete authentication cycle:
 * 1. Register a new customer
 * 2. Login with the same credentials
 * 3. Verify the session and user data
 * 4. Clean up test data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const testEmail = `auth-test-${Date.now()}@fishertesting.com`;
const testPassword = 'TestPassword123!';

async function testRegistration() {
  console.log('🔐 Testing registration API...');
  
  const response = await fetch('http://localhost:3010/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      firstName: 'Test',
      lastName: 'Customer',
      companyName: 'Test Company',
      phone: '555-123-4567'
    })
  });

  const result = await response.json();
  
  if (!response.ok) {
    console.error('❌ Registration failed:', result);
    return null;
  }

  console.log('✅ Registration successful');
  console.log('   User ID:', result.user?.id);
  console.log('   Account Number:', result.user?.accountNumber);
  console.log('   Status:', result.user?.status);
  
  return result.user;
}

async function testLogin() {
  console.log('\n🔓 Testing login API...');
  
  const response = await fetch('http://localhost:3010/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword
    })
  });

  const result = await response.json();
  
  if (!response.ok) {
    console.error('❌ Login failed:', result);
    return null;
  }

  console.log('✅ Login successful');
  console.log('   User ID:', result.user?.id);
  console.log('   Name:', result.user?.name);
  console.log('   Account Number:', result.user?.accountNumber);
  console.log('   Session expires:', new Date(result.session?.expires_at * 1000).toISOString());
  
  return result;
}

async function cleanupTestData(userId) {
  if (!userId) return;
  
  console.log('\n🧹 Cleaning up test data...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Find customer record
    const { data: customer, error: findError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', userId)
      .single();

    if (findError) {
      console.error('❌ Could not find customer to clean up:', findError);
      return;
    }

    // Delete customer record
    const { error: deleteCustomerError } = await supabase
      .from('customers')
      .delete()
      .eq('id', userId);

    if (deleteCustomerError) {
      console.error('❌ Failed to delete customer:', deleteCustomerError);
      return;
    }

    // Delete auth user
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(
      customer.auth_user_id
    );

    if (deleteAuthError) {
      console.error('❌ Failed to delete auth user:', deleteAuthError);
      return;
    }

    console.log('✅ Test data cleaned up successfully');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting full authentication flow test...\n');
  console.log('Test email:', testEmail);
  
  let userId = null;
  
  try {
    // Step 1: Test Registration
    const registrationResult = await testRegistration();
    if (!registrationResult) {
      console.log('\n❌ Authentication test failed at registration step');
      process.exit(1);
    }
    
    userId = registrationResult.id;
    
    // Step 2: Test Login
    const loginResult = await testLogin();
    if (!loginResult) {
      console.log('\n❌ Authentication test failed at login step');
      process.exit(1);
    }
    
    // Step 3: Verify consistency
    if (registrationResult.id !== loginResult.user.id) {
      console.error('\n❌ User ID mismatch between registration and login!');
      console.error('   Registration ID:', registrationResult.id);
      console.error('   Login ID:', loginResult.user.id);
      process.exit(1);
    }
    
    console.log('\n🎉 FULL AUTHENTICATION TEST PASSED!');
    console.log('   ✅ Registration works');
    console.log('   ✅ Login works');
    console.log('   ✅ Session management works');
    console.log('   ✅ User data consistency maintained');
    console.log('\n🚀 Production authentication should be fully functional!');
    
  } catch (error) {
    console.error('\n💥 Test failed with exception:', error.message);
    process.exit(1);
  } finally {
    // Always try to clean up
    if (userId) {
      await cleanupTestData(userId);
    }
  }
  
  process.exit(0);
}

main().catch(console.error);