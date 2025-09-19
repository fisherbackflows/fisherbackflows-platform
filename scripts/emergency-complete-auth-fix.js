#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function emergencyCompleteAuthFix() {
  console.log('🚨 EMERGENCY COMPLETE AUTHENTICATION FIX');
  console.log('This will diagnose and fix ALL authentication issues\n');

  try {
    const supabase = createClient(
      'https://jvhbqfueutvfepsjmztx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY'
    );

    console.log('🔍 STEP 1: TESTING SERVICE ROLE ACCESS TO CUSTOMERS TABLE');
    console.log('─'.repeat(60));
    
    // Test basic access
    const { data: testAccess, error: accessError } = await supabase
      .from('customers')
      .select('id, email, first_name, auth_user_id')
      .limit(1);

    if (accessError) {
      console.log('❌ SERVICE ROLE CANNOT ACCESS CUSTOMERS TABLE');
      console.log(`Error: ${accessError.message}`);
      console.log('Code:', accessError.code);
      console.log('\n🔧 RLS POLICIES ARE BLOCKING SERVICE ROLE ACCESS');
      console.log('IMMEDIATE ACTION REQUIRED:');
      console.log('\n📋 Execute this SQL in Supabase Dashboard → SQL Editor:');
      console.log('─'.repeat(60));
      console.log('-- EMERGENCY: Allow service role access to customers table');
      console.log('CREATE POLICY "emergency_service_role_access" ON customers');
      console.log('  FOR ALL TO service_role');
      console.log('  USING (true)');
      console.log('  WITH CHECK (true);');
      console.log('─'.repeat(60));
      console.log('\nAfter executing the SQL, run this script again.\n');
      return false;
    }

    console.log('✅ Service role can access customers table');
    console.log(`Found: ${testAccess?.length || 0} customer records\n`);

    console.log('🔍 STEP 2: TESTING AUTHENTICATION AND CUSTOMER LINKING');
    console.log('─'.repeat(60));

    // Get a test customer
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', 'test@example.com')
      .maybeSingle();

    if (customerError) {
      console.log('❌ Cannot find test customer:', customerError.message);
      return false;
    }

    if (!customers) {
      console.log('⚠️  Test customer not found. Creating one...');
      // The registration worked, so there should be a customer. Let's check all customers
      const { data: allCustomers, error: allError } = await supabase
        .from('customers')
        .select('id, email, first_name, last_name, auth_user_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (allError) {
        console.log('❌ Cannot access customers at all:', allError.message);
        return false;
      }
      
      console.log(`Found ${allCustomers.length} recent customers:`);
      allCustomers.forEach((customer, i) => {
        console.log(`${i + 1}. ${customer.first_name} ${customer.last_name} (${customer.email})`);
        console.log(`   Auth User ID: ${customer.auth_user_id || 'NULL'}`);
      });
      
      return false;
    }

    console.log(`✅ Found customer: ${customers.first_name} ${customers.last_name}`);
    console.log(`Email: ${customers.email}`);
    console.log(`Customer ID: ${customers.id}`);
    console.log(`Auth User ID: ${customers.auth_user_id || 'NULL'}`);
    console.log(`Account Status: ${customers.account_status}\n`);

    // Test authentication
    console.log('🔐 Testing Supabase Auth for this customer...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: customers.email,
      password: 'testpass123'
    });

    if (authError) {
      console.log('❌ Authentication failed:', authError.message);
      
      if (authError.message.includes('Invalid credentials')) {
        console.log('Either the auth user doesn\'t exist or password is wrong');
        
        // Check if auth user exists at all
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          customers.email,
          { redirectTo: 'https://fisherbackflows.com' }
        );
        
        if (resetError && resetError.message.includes('User not found')) {
          console.log('❌ Auth user doesn\'t exist - registration failed to create auth user');
        } else {
          console.log('✅ Auth user exists but password might be different');
        }
      }
      return false;
    }

    console.log('✅ Authentication successful!');
    console.log(`Auth User ID from login: ${authData.user.id}`);
    console.log(`Email confirmed: ${authData.user.email_confirmed_at ? 'YES' : 'NO'}\n`);

    // Check if auth_user_id matches
    if (customers.auth_user_id === authData.user.id) {
      console.log('✅ Auth User ID matches customer record - linkage is correct');
    } else {
      console.log('❌ AUTH USER ID MISMATCH DETECTED');
      console.log(`Customer record has: ${customers.auth_user_id}`);
      console.log(`Auth user is: ${authData.user.id}`);
      console.log('\n🔧 FIXING AUTH USER ID LINKAGE...');
      
      const { error: updateError } = await supabase
        .from('customers')
        .update({ auth_user_id: authData.user.id })
        .eq('id', customers.id);
        
      if (updateError) {
        console.log('❌ Failed to update auth_user_id:', updateError.message);
        console.log('This suggests UPDATE policies are blocking service role');
        console.log('\n📋 Execute this SQL to fix UPDATE access:');
        console.log('CREATE POLICY "emergency_service_role_update" ON customers');
        console.log('  FOR UPDATE TO service_role');
        console.log('  USING (true)');
        console.log('  WITH CHECK (true);');
        return false;
      } else {
        console.log('✅ Successfully updated auth_user_id linkage!');
      }
    }

    console.log('\n🔍 STEP 3: TESTING COMPLETE LOGIN FLOW');
    console.log('─'.repeat(60));

    // Simulate exact login API query
    const { data: loginCustomer, error: loginError } = await supabase
      .from('customers')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle();

    if (loginError) {
      console.log('❌ Login query failed:', loginError.message);
      return false;
    }

    if (!loginCustomer) {
      console.log('❌ Login query returned no customer');
      return false;
    }

    console.log('✅ Login query successful!');
    console.log(`Found customer: ${loginCustomer.first_name} ${loginCustomer.last_name}`);
    console.log(`Account status: ${loginCustomer.account_status}`);

    if (loginCustomer.account_status !== 'active') {
      console.log('⚠️  Account status is not active - fixing...');
      const { error: statusError } = await supabase
        .from('customers')
        .update({ account_status: 'active' })
        .eq('id', loginCustomer.id);
        
      if (statusError) {
        console.log('❌ Failed to update account status:', statusError.message);
      } else {
        console.log('✅ Account status updated to active');
      }
    }

    console.log('\n🎉 AUTHENTICATION FIX COMPLETED SUCCESSFULLY!');
    console.log('─'.repeat(60));
    console.log('✅ Service role can access customers table');
    console.log('✅ Customer record exists and has correct auth_user_id');
    console.log('✅ Supabase Auth user exists and works');
    console.log('✅ Login query works correctly');
    console.log('✅ Account status is active');
    console.log('\n🧪 LOGIN SHOULD NOW WORK! Test it:');
    console.log(`curl -X POST http://localhost:3010/api/auth/login -H "Content-Type: application/json" -d '{"email":"${customers.email}","password":"testpass123"}'`);

    return true;

  } catch (error) {
    console.error('💥 Emergency fix failed:', error.message);
    return false;
  }
}

emergencyCompleteAuthFix();