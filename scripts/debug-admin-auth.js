#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Create admin client like in the login API
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testAdminAuth() {
  const email = 'auth-test-1757276138189@fishertesting.com';
  const password = 'TestPassword123!';
  
  try {
    console.log('Testing supabaseAdmin.auth.signInWithPassword...');
    
    // This is what the login API does
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.error('❌ Admin auth failed:', authError?.message);
      return null;
    }

    console.log('✅ Admin auth succeeded');
    console.log('   Auth User ID:', authData.user?.id);
    console.log('   Email confirmed:', authData.user?.email_confirmed_at ? 'Yes' : 'No');
    
    // Now try to find customer
    console.log('\nLooking up customer by auth_user_id...');
    const { data: customerData, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle();

    if (customerError) {
      console.error('❌ Customer lookup failed:', customerError);
      return null;
    }

    if (!customerData) {
      console.error('❌ No customer found for auth_user_id:', authData.user.id);
      return null;
    }

    console.log('✅ Customer found');
    console.log('   Customer ID:', customerData.id);
    console.log('   Email:', customerData.email);
    console.log('   Status:', customerData.account_status);
    
    return { authData, customerData };

  } catch (err) {
    console.error('Exception:', err.message);
    return null;
  }
}

testAdminAuth();