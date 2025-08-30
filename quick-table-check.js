const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkTables() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Try to query customers table
  const { data, error } = await supabase.from('customers').select('count', { count: 'exact', head: true });
  
  if (error) {
    console.log('❌ Tables need to be created. Error:', error.message);
    console.log('\n📋 You need to run the migration script in Supabase SQL Editor:');
    console.log('   Copy contents of: supabase-simple-setup.sql');
    return false;
  } else {
    console.log('✅ Tables exist and working!');
    return true;
  }
}

checkTables();