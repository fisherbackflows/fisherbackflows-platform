/**
 * Test RLS via actual API requests (not SQL Editor)
 * This will show you if RLS is actually protecting your data
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jvhbqfueutvfepsjmztx.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM0NzUsImV4cCI6MjA3MTg0OTQ3NX0.UuEuNrFU-JXWvoICUNCupz1MzLvWVrcIqRA-LwpI1Jo';

async function testRLS() {
  console.log('🔍 Testing RLS Protection via API (Not SQL Editor)\n');
  console.log('========================================\n');

  // Create client with ANON key (not service role)
  const supabase = createClient(supabaseUrl, anonKey);

  const tables = [
    'customers',
    'devices', 
    'appointments',
    'test_reports',
    'invoices',
    'payments'
  ];

  console.log('Testing as ANONYMOUS user (not authenticated):\n');

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(5);

      if (error) {
        console.log(`✅ ${table}: Protected! (Error: ${error.message})`);
      } else {
        const count = data ? data.length : 0;
        if (count === 0) {
          console.log(`✅ ${table}: Protected! (0 records accessible)`);
        } else {
          console.log(`❌ ${table}: EXPOSED! (${count} records accessible)`);
        }
      }
    } catch (err) {
      console.log(`✅ ${table}: Protected! (Access denied)`);
    }
  }

  console.log('\n========================================');
  console.log('\n📊 SUMMARY:');
  console.log('If you see ✅ for all tables, RLS is working!');
  console.log('If you see ❌, those tables need RLS policies.');
  console.log('\nNOTE: The SQL Editor shows all data because you\'re');
  console.log('running as postgres user which bypasses RLS.');
}

testRLS().catch(console.error);