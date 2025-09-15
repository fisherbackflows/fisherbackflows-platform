#!/usr/bin/env node

// Apply corrected RLS fixes using public schema
require('dotenv').config({ path: '.env.local' });

async function applyCorrectedRLS() {
  console.log('🔧 APPLYING CORRECTED RLS FIXES (PUBLIC SCHEMA)\n');

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ No Supabase service role key found');
    return;
  }

  try {
    // We'll provide the SQL for manual execution since API restrictions exist
    console.log('📋 CORRECTED SQL FOR MANUAL EXECUTION:\n');
    console.log('Copy and paste this SQL into Supabase Dashboard > SQL Editor:\n');
    console.log('=' * 60);

    const fs = await import('fs');
    const sqlContent = fs.readFileSync('./fix-rls-corrected.sql', 'utf8');
    console.log(sqlContent);

    console.log('=' * 60);
    console.log('\n🎯 MANUAL EXECUTION STEPS:');
    console.log('1. Go to https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx');
    console.log('2. Click "SQL Editor" in the left sidebar');
    console.log('3. Create a new query');
    console.log('4. Copy and paste the SQL above');
    console.log('5. Click "Run" to execute');

    console.log('\n✅ KEY CHANGES IN CORRECTED VERSION:');
    console.log('- Uses public.is_team_member() instead of auth.is_team_member()');
    console.log('- Uses public.is_admin() instead of auth.is_admin()');
    console.log('- Uses public.is_customer() instead of auth.is_customer()');
    console.log('- All functions created in public schema (no permission issues)');

    console.log('\n🔍 VERIFICATION:');
    console.log('After executing the SQL, run: node test-security-fixes.js');

    console.log('\n🛡️ EXPECTED RESULTS:');
    console.log('- billing_invoices: Customer + Team access policies');
    console.log('- security_logs: Admin-only access policy');
    console.log('- technician_current_location: Team access policy');
    console.log('- technician_locations: Team access policy');
    console.log('- Anonymous access blocked on all 4 tables');

  } catch (error) {
    console.log('❌ Error reading SQL file:', error.message);
  }
}

applyCorrectedRLS().catch(console.error);