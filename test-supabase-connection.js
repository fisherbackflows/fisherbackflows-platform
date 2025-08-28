// Test Supabase Connection
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Service Key:', supabaseServiceKey ? '✅ Present' : '❌ Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    // Test 1: Check if we can connect
    console.log('\n📊 Fetching existing tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.error('❌ Error fetching tables:', tablesError.message);
    } else {
      console.log('✅ Connected successfully!');
      console.log('📋 Existing tables:', tables?.map(t => t.table_name).join(', ') || 'None');
    }

    // Test 2: Check for Fisher Backflows tables
    console.log('\n🔍 Checking for Fisher Backflows tables...');
    const fisherTables = ['customers', 'devices', 'test_reports', 'invoices', 'appointments', 'team_users'];
    
    for (const table of fisherTables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ Table '${table}' not found`);
      } else {
        console.log(`✅ Table '${table}' exists (${count || 0} records)`);
      }
    }

    console.log('\n✨ Connection test complete!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();