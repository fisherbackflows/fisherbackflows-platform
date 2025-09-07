#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function testSpecificCustomerLookup() {
  console.log('🎯 TESTING SPECIFIC CUSTOMER LOOKUP');
  console.log('Testing the exact query used in the login API\n');

  try {
    const supabase = createClient(
      'https://jvhbqfueutvfepsjmztx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY'
    );

    // From our previous debug, we know:
    // Email: test@example.com
    // Customer ID: 1372cdd2-f160-48c5-84cd-03d939789636  
    // Auth User ID: 7fb75905-4f20-45fe-98e8-baa0633602e4

    const knownAuthUserId = '7fb75905-4f20-45fe-98e8-baa0633602e4';
    const knownEmail = 'test@example.com';

    // Test 1: Authenticate with Supabase Auth first (simulate login API step 1)
    console.log('🔐 Step 1: Testing Supabase Auth authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: knownEmail,
      password: 'testpass123'
    });

    if (authError || !authData.user) {
      console.log('❌ Authentication failed:', authError?.message);
      console.log('This means the Supabase Auth user doesn\'t exist or password is wrong');
      
      // Try to see if auth user exists at all
      console.log('   🔍 Checking if auth user exists with password reset...');
      const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(
        knownEmail,
        { redirectTo: 'https://fisherbackflows.com/reset-password' }
      );
      
      if (resetError && (resetError.message.includes('User not found') || resetError.message.includes('not exist'))) {
        console.log('   ❌ Auth user doesn\'t exist at all - registration never created auth user');
      } else {
        console.log('   ✅ Auth user exists but password is wrong');
      }
      return false;
    }

    console.log('✅ Authentication successful!');
    console.log(`   Auth User ID: ${authData.user.id}`);
    console.log(`   Email confirmed: ${authData.user.email_confirmed_at ? 'YES' : 'NO'}`);
    
    // Test 2: Query customer using auth_user_id (simulate login API step 3)
    console.log('\n👤 Step 2: Testing customer lookup by auth_user_id...');
    console.log(`   Looking for auth_user_id: ${authData.user.id}`);
    
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle();

    if (customerError) {
      console.log('❌ Customer lookup failed:', customerError.message);
      console.log('   Code:', customerError.code);
      
      if (customerError.code === 'PGRST116') {
        console.log('   Multiple records found - trying with limit...');
        const { data: allCustomers, error: allError } = await supabase
          .from('customers')
          .select('*')
          .eq('auth_user_id', authData.user.id)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (allError) {
          console.log('   ❌ Even limited query failed:', allError.message);
        } else {
          console.log(`   ✅ Found ${allCustomers.length} customer(s) with limit`);
          if (allCustomers.length > 0) {
            console.log(`   Customer: ${allCustomers[0].first_name} ${allCustomers[0].last_name}`);
            console.log(`   Status: ${allCustomers[0].account_status}`);
          }
        }
      }
      return false;
    }

    if (!customerData) {
      console.log('❌ No customer data found');
      console.log('   This means auth_user_id doesn\'t match any customer record');
      
      // Double-check by looking for the customer record by email
      console.log('   🔍 Checking if customer exists by email...');
      const { data: emailCustomer, error: emailError } = await supabase
        .from('customers')
        .select('id, email, auth_user_id, first_name, last_name')
        .eq('email', knownEmail);
        
      if (emailError) {
        console.log('   ❌ Email lookup failed:', emailError.message);
      } else {
        console.log(`   Found ${emailCustomer.length} customer(s) with this email:`);
        emailCustomer.forEach(customer => {
          console.log(`     • ${customer.first_name} ${customer.last_name}`);
          console.log(`       ID: ${customer.id}`);
          console.log(`       Auth User ID: ${customer.auth_user_id}`);
          console.log(`       Expected: ${authData.user.id}`);
          console.log(`       Match: ${customer.auth_user_id === authData.user.id ? 'YES' : 'NO'}`);
        });
      }
      return false;
    }

    // Test 3: Check account status
    console.log('✅ Customer lookup successful!');
    console.log(`   Customer: ${customerData.first_name} ${customerData.last_name}`);
    console.log(`   Email: ${customerData.email}`);
    console.log(`   Account Status: ${customerData.account_status}`);
    console.log(`   Account Number: ${customerData.account_number}`);
    
    if (customerData.account_status !== 'active') {
      console.log('⚠️  Account status is not active - this would cause login to fail');
    } else {
      console.log('✅ Account status is active - login should succeed');
    }

    console.log('\n🎉 FULL LOGIN SIMULATION SUCCESSFUL!');
    console.log('The login API should work for this user. If it\'s still failing, there may be:');
    console.log('1. A JSON parsing error in the API');
    console.log('2. A middleware or route issue');
    console.log('3. A timing/race condition');

    return true;

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    return false;
  }
}

testSpecificCustomerLookup();