#!/usr/bin/env node

const { supabaseAdmin } = require('../src/lib/supabase');

async function testLibAdmin() {
  const email = 'auth-test-1757276138189@fishertesting.com';
  const password = 'TestPassword123!';
  
  try {
    console.log('Testing with actual supabaseAdmin from lib...');
    console.log('Admin client exists:', !!supabaseAdmin);
    
    if (!supabaseAdmin) {
      console.error('❌ supabaseAdmin is null - configuration issue');
      return;
    }
    
    // Step 1: Test auth
    console.log('\n1. Testing authentication...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.error('❌ Auth failed:', authError?.message);
      return;
    }

    console.log('✅ Auth succeeded');
    console.log('   Auth User ID:', authData.user?.id);
    console.log('   Email confirmed:', authData.user?.email_confirmed_at ? 'Yes' : 'No');
    
    // Step 2: Test customer lookup
    console.log('\n2. Testing customer lookup...');
    const { data: customerData, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle();

    if (customerError) {
      console.error('❌ Customer lookup failed:', customerError);
      return;
    }

    if (!customerData) {
      console.error('❌ No customer found for auth_user_id:', authData.user.id);
      
      // Debug: try to find any customer with that auth_user_id
      console.log('\n   Debug: Looking for any customers with this auth_user_id...');
      const { data: debugData, error: debugError } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('auth_user_id', authData.user.id);
        
      console.log('   Debug result count:', debugData?.length || 0);
      console.log('   Debug error:', debugError);
      
      return;
    }

    console.log('✅ Customer found');
    console.log('   Customer ID:', customerData.id);
    console.log('   Email:', customerData.email);
    console.log('   Status:', customerData.account_status);
    
    console.log('\n🎉 Login flow should work!');

  } catch (err) {
    console.error('Exception:', err.message);
  }
}

testLibAdmin();