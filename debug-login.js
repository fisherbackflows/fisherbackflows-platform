const { createClient } = require('@supabase/supabase-js');

async function debugLogin() {
  const supabaseUrl = 'https://jvhbqfueutvfepsjmztx.supabase.co';
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY';
  
  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('Testing login for: finalverify1757270865@example.com');
  console.log('Expected auth user ID: d5259552-58d7-4134-9d0d-55a91c88177e');

  try {
    // Step 1: Try auth login
    console.log('\n=== STEP 1: Supabase Auth Login ===');
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: 'finalverify1757270865@example.com',
      password: 'FinalTest123!'
    });

    if (authError) {
      console.error('Auth Error:', authError.message);
      console.error('Auth Error Code:', authError.code);
      return;
    }

    console.log('Auth Success!');
    console.log('Auth User ID:', authData.user.id);
    console.log('Email Confirmed:', authData.user.email_confirmed_at);

    // Step 2: Look up customer
    console.log('\n=== STEP 2: Customer Lookup ===');
    const { data: customerData, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (customerError) {
      console.error('Customer Error:', customerError.message);
      console.error('Customer Error Code:', customerError.code);
    } else {
      console.log('Customer Found!');
      console.log('Customer ID:', customerData.id);
      console.log('Account Status:', customerData.account_status);
      console.log('Auth User ID Match:', customerData.auth_user_id === authData.user.id);
    }

  } catch (error) {
    console.error('Debug Error:', error.message);
  }
}

debugLogin().then(() => {
  console.log('\nDebug complete');
  process.exit(0);
});