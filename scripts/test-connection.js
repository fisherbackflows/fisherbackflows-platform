#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  try {
    const supabase = createClient(
      'https://jvhbqfueutvfepsjmztx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY'
    );

    console.log('🔄 Testing Supabase connection and checking existing tables...');
    
    // Try to list all tables by attempting to query different ones
    const tables = ['customers', 'team_users', 'invoices', 'invoice_line_items', 'appointments', 'devices', 'payments'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: ${count || 0} records`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }
    
    // Try to use the SQL endpoint directly
    console.log('\n🔄 Testing direct SQL execution via REST API...');
    
    const response = await fetch('https://jvhbqfueutvfepsjmztx.supabase.co/rest/v1/rpc/version', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY',
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY'
      }
    });
    
    if (response.ok) {
      const data = await response.text();
      console.log('✅ REST API working:', data);
    } else {
      console.log('❌ REST API failed:', response.status, response.statusText);
    }
    
    // Check what RPC functions are available
    console.log('\n🔄 Checking available RPC functions...');
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('version');
      
    if (rpcError) {
      console.log('❌ RPC version failed:', rpcError.message);
    } else {
      console.log('✅ RPC version works:', rpcData);
    }
    
    console.log('\n🎯 Connection test completed');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

testConnection();