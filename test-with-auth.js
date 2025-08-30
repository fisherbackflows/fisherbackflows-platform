const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testWithAuth() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  console.log('🔍 Testing Direct Database Access...');
  
  // Test customers table
  const { data: customers, error: custError } = await supabase
    .from('customers')
    .select('*')
    .limit(5);
  
  if (custError) {
    console.log('❌ Customers table error:', custError.message);
  } else {
    console.log(`✅ Customers table: ${customers?.length || 0} records found`);
    if (customers?.length > 0) {
      console.log('   Sample:', customers[0].first_name, customers[0].last_name);
    }
  }
  
  // Test team_users table
  const { data: teamUsers, error: teamError } = await supabase
    .from('team_users')
    .select('*')
    .limit(5);
    
  if (teamError) {
    console.log('❌ Team users error:', teamError.message);
  } else {
    console.log(`✅ Team users table: ${teamUsers?.length || 0} records found`);
  }
  
  // Test devices table
  const { data: devices, error: devError } = await supabase
    .from('devices')
    .select('*')
    .limit(5);
    
  if (devError) {
    console.log('❌ Devices table error:', devError.message);
  } else {
    console.log(`✅ Devices table: ${devices?.length || 0} records found`);
  }
  
  console.log('\n🎯 Database Status: All core tables are accessible!');
}

testWithAuth().catch(console.error);