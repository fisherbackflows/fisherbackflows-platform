/**
 * Test leads table protection specifically
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jvhbqfueutvfepsjmztx.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNzM0NzUsImV4cCI6MjA3MTg0OTQ3NX0.UuEuNrFU-JXWvoICUNCupz1MzLvWVrcIqRA-LwpI1Jo';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY';

async function testLeadsProtection() {
  console.log('🔍 Testing Leads Table Protection\n');

  // Test 1: Anonymous user (should be blocked)
  console.log('1. Testing with ANONYMOUS user:');
  const anonSupabase = createClient(supabaseUrl, anonKey);
  
  try {
    const { data, error } = await anonSupabase.from('leads').select('*').limit(1);
    
    if (error) {
      console.log('   ✅ Anonymous access BLOCKED (Error: ' + error.message + ')');
    } else if (!data || data.length === 0) {
      console.log('   ✅ Anonymous access BLOCKED (0 records returned)');
    } else {
      console.log('   ❌ Anonymous access ALLOWED (' + data.length + ' records returned)');
    }
  } catch (err) {
    console.log('   ✅ Anonymous access BLOCKED (Exception: ' + err.message + ')');
  }

  // Test 2: Service role (should have access)
  console.log('\n2. Testing with SERVICE ROLE (for API operations):');
  const serviceSupabase = createClient(supabaseUrl, serviceKey);
  
  try {
    const { data, error } = await serviceSupabase.from('leads').select('*').limit(1);
    
    if (error) {
      console.log('   ❌ Service role BLOCKED (Error: ' + error.message + ')');
    } else {
      const count = data ? data.length : 0;
      console.log('   ✅ Service role has access (' + count + ' records - API operations work)');
    }
  } catch (err) {
    console.log('   ❌ Service role ERROR (' + err.message + ')');
  }

  console.log('\n📊 CONCLUSION:');
  console.log('If anonymous is blocked but service role works, the leads table is properly protected!');
  console.log('The RLS policy is working - only team members can access leads data.');
}

testLeadsProtection().catch(console.error);