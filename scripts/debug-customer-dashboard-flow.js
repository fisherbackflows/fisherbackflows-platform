// Debug customer dashboard flow
const { createClient } = require('@supabase/supabase-js');

async function debugCustomerDashboardFlow() {
  console.log('🔍 DEBUGGING CUSTOMER DASHBOARD FLOW\n');
  
  const supabase = createClient(
    'https://jvhbqfueutvfepsjmztx.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const testEmail = 'test.customer.fixed@example.com';
  const testPassword = 'TestPassword123';
  
  try {
    console.log('1. SIMULATING LOGIN API CALL:');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (authError || !authData.user) {
      console.error('❌ Auth failed:', authError?.message);
      return;
    }
    
    console.log('✅ Authentication successful');
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}`);
    
    console.log('\n2. CHECKING CUSTOMER LOOKUP BY auth_user_id:');
    const { data: customerByAuthId, error: authIdError } = await supabase
      .from('customers')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle();
    
    console.log('Query result:', { 
      found: !!customerByAuthId, 
      error: authIdError?.message,
      customer: customerByAuthId ? {
        id: customerByAuthId.id,
        name: `${customerByAuthId.first_name} ${customerByAuthId.last_name}`,
        email: customerByAuthId.email,
        auth_user_id: customerByAuthId.auth_user_id
      } : null
    });
    
    console.log('\n3. CHECKING CUSTOMER LOOKUP BY EMAIL:');
    const { data: customerByEmail, error: emailError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', authData.user.email)
      .maybeSingle();
      
    console.log('Query result:', { 
      found: !!customerByEmail, 
      error: emailError?.message,
      customer: customerByEmail ? {
        id: customerByEmail.id,
        name: `${customerByEmail.first_name} ${customerByEmail.last_name}`,
        email: customerByEmail.email,
        auth_user_id: customerByEmail.auth_user_id
      } : null
    });
    
    console.log('\n4. CHECKING FOR auth_user_id MISMATCH:');
    if (customerByEmail && customerByEmail.auth_user_id !== authData.user.id) {
      console.log('⚠️  MISMATCH DETECTED!');
      console.log(`   Customer auth_user_id: ${customerByEmail.auth_user_id}`);
      console.log(`   Actual auth user ID: ${authData.user.id}`);
      console.log('   This would cause useCustomerData hook to fail!');
      
      console.log('\n5. FIXING auth_user_id MISMATCH:');
      const { data: updatedCustomer, error: updateError } = await supabase
        .from('customers')
        .update({ auth_user_id: authData.user.id })
        .eq('id', customerByEmail.id)
        .select('*')
        .single();
        
      if (updateError) {
        console.error('❌ Failed to fix mismatch:', updateError.message);
      } else {
        console.log('✅ Fixed auth_user_id mismatch');
        console.log(`   Updated customer ID: ${updatedCustomer.id}`);
      }
    } else {
      console.log('✅ auth_user_id matches correctly');
    }
    
    console.log('\n6. TESTING useCustomerData QUERY SIMULATION:');
    const { data: hookTestData, error: hookTestError } = await supabase
      .from('customers')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();
      
    if (hookTestError) {
      console.error('❌ useCustomerData query would fail:', hookTestError.message);
      if (hookTestError.code === 'PGRST116') {
        console.log('   Multiple customer records found - this could cause issues');
      }
    } else {
      console.log('✅ useCustomerData query would succeed');
      console.log(`   Customer: ${hookTestData.first_name} ${hookTestData.last_name}`);
    }
    
    console.log('\n7. DASHBOARD READINESS:');
    if (hookTestData) {
      console.log('✅ Customer login flow should work end-to-end');
      console.log('✅ useCustomerData hook should load customer data');
      console.log('✅ Dashboard should render customer information');
    } else {
      console.log('❌ Dashboard would fail to load customer data');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

debugCustomerDashboardFlow();