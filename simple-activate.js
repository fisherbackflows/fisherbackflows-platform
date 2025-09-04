#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function simpleActivate() {
  console.log('\n🔧 Simple Account Activation\n');
  console.log('='.repeat(50));
  
  const email = 'customer@fisherbackflows.com';
  
  try {
    // Just update the account status
    const { data, error } = await supabase
      .from('customers')
      .update({ account_status: 'active' })
      .eq('email', email)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Update failed:', error);
    } else {
      console.log('✅ Account activated successfully!');
      console.log(`   Email: ${data.email}`);
      console.log(`   Status: ${data.account_status}`);
      console.log(`   Account Number: ${data.account_number}`);
      
      console.log('\n🔑 LOGIN TEST:');
      console.log('   URL: https://www.fisherbackflows.com/portal');  
      console.log('   Email: customer@fisherbackflows.com');
      console.log('   Password: [Use registration password]');
      console.log('\n✅ Account should now allow login!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

simpleActivate();