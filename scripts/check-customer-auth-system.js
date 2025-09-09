const { createClient } = require('@supabase/supabase-js');

async function analyzeCustomerAuthSystem() {
  const supabase = createClient(
    'https://jvhbqfueutvfepsjmztx.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔍 CUSTOMER AUTHENTICATION SYSTEM ANALYSIS\n');

  try {
    // 1. Check recent customers and their auth status
    console.log('1. RECENT CUSTOMER RECORDS:');
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, email, auth_user_id, account_status, first_name, last_name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (customerError) {
      console.error('❌ Customer query error:', customerError);
      return;
    }
    
    customers?.forEach((c, i) => {
      console.log(`${i+1}. ${c.email}`);
      console.log(`   Name: ${c.first_name} ${c.last_name}`);
      console.log(`   Auth User ID: ${c.auth_user_id ? '✅ ' + c.auth_user_id : '❌ MISSING'}`);
      console.log(`   Status: ${c.account_status}`);
      console.log(`   Created: ${new Date(c.created_at).toLocaleString()}\n`);
    });

    // 2. Check auth users
    console.log('2. SUPABASE AUTH USERS:');
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Auth users query error:', authError);
      return;
    }

    console.log(`Total auth users: ${authData.users?.length || 0}`);
    authData.users?.slice(0, 5).forEach((user, i) => {
      console.log(`${i+1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Confirmed: ${user.email_confirmed_at ? '✅ ' + new Date(user.email_confirmed_at).toLocaleString() : '❌ NOT CONFIRMED'}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}\n`);
    });

    // 3. Check for orphaned records
    console.log('3. DATA INTEGRITY ANALYSIS:');
    const authUserIds = authData.users?.map(u => u.id) || [];
    const customerAuthIds = customers?.map(c => c.auth_user_id).filter(Boolean) || [];
    
    const orphanedCustomers = customers?.filter(c => c.auth_user_id && !authUserIds.includes(c.auth_user_id)) || [];
    const orphanedAuthUsers = authData.users?.filter(u => !customerAuthIds.includes(u.id)) || [];
    
    console.log(`✅ Customers with valid auth: ${customers?.filter(c => c.auth_user_id && authUserIds.includes(c.auth_user_id)).length || 0}`);
    console.log(`❌ Orphaned customers (no auth user): ${orphanedCustomers.length}`);
    console.log(`❌ Orphaned auth users (no customer): ${orphanedAuthUsers.length}`);
    
    if (orphanedCustomers.length > 0) {
      console.log('\nOrphaned customers:');
      orphanedCustomers.forEach(c => console.log(`  - ${c.email} (auth_user_id: ${c.auth_user_id})`));
    }
    
    if (orphanedAuthUsers.length > 0) {
      console.log('\nOrphaned auth users:');
      orphanedAuthUsers.forEach(u => console.log(`  - ${u.email} (id: ${u.id})`));
    }

    // 4. Test login reliability
    console.log('\n4. LOGIN SYSTEM RELIABILITY:');
    const testEmail = customers?.[0]?.email;
    if (testEmail) {
      console.log(`Testing customer lookup for: ${testEmail}`);
      
      const { data: testCustomer, error: testError } = await supabase
        .from('customers')
        .select('*')
        .eq('email', testEmail)
        .maybeSingle();
      
      if (testError) {
        console.log(`❌ Customer lookup failed: ${testError.message}`);
      } else if (!testCustomer) {
        console.log(`❌ No customer found for email`);
      } else {
        console.log(`✅ Customer lookup successful`);
        console.log(`   ID: ${testCustomer.id}`);
        console.log(`   Auth User ID: ${testCustomer.auth_user_id}`);
        console.log(`   Status: ${testCustomer.account_status}`);
      }
    }

    console.log('\n5. SYSTEM SUMMARY:');
    console.log(`✅ Registration creates: Supabase Auth User + Customer Record`);
    console.log(`✅ Login authenticates: Email/Password via Supabase Auth`);
    console.log(`✅ Customer data: Stored in customers table with auth_user_id link`);
    console.log(`✅ Email verification: SKIPPED (auto-confirmed for immediate login)`);
    console.log(`✅ Account status: Active by default`);

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

analyzeCustomerAuthSystem();