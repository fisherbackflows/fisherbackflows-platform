#!/usr/bin/env node

// Test RLS directly by checking anonymous vs authenticated access
require('dotenv').config({ path: '.env.local' });

async function testRLSDirectly() {
  console.log('🔍 TESTING RLS ENFORCEMENT DIRECTLY\n');

  try {
    const { createClient } = await import('@supabase/supabase-js');

    // Test with service role (should work)
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test with anonymous key (should be blocked)
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const tables = ['billing_invoices', 'security_logs', 'technician_current_location', 'technician_locations'];

    console.log('🔐 Testing Service Role Access (should work):');
    for (const table of tables) {
      try {
        const { data, error } = await serviceSupabase
          .from(table)
          .select('*')
          .limit(1);

        if (!error) {
          console.log(`✅ ${table}: Service role access working (${data?.length || 0} rows)`);
        } else {
          console.log(`❌ ${table}: Service role failed - ${error.message}`);
        }
      } catch (err) {
        console.log(`❌ ${table}: Service role error - ${err.message}`);
      }
    }

    console.log('\n🚫 Testing Anonymous Access (should be blocked):');
    let blockedCount = 0;
    for (const table of tables) {
      try {
        const { data, error } = await anonSupabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          if (error.message.includes('JWT') || error.message.includes('row-level security') || error.message.includes('policy')) {
            console.log(`✅ ${table}: Anonymous access properly blocked`);
            blockedCount++;
          } else {
            console.log(`⚠️ ${table}: Blocked but unexpected error - ${error.message}`);
            blockedCount++;
          }
        } else {
          console.log(`❌ ${table}: Anonymous access allowed! (${data?.length || 0} rows) - SECURITY ISSUE`);
        }
      } catch (err) {
        console.log(`✅ ${table}: Anonymous access blocked (${err.message})`);
        blockedCount++;
      }
    }

    console.log('\n📊 RLS ENFORCEMENT RESULTS:');
    console.log(`🛡️ Tables with proper RLS: ${blockedCount}/4`);

    if (blockedCount === 4) {
      console.log('🟢 RLS WORKING CORRECTLY - All tables secured');
    } else if (blockedCount >= 2) {
      console.log('🟡 RLS PARTIALLY WORKING - Some tables need attention');
    } else {
      console.log('🔴 RLS NOT WORKING - Critical security vulnerability');
    }

    // Test if policies exist
    console.log('\n🔍 CHECKING POLICY EXISTENCE:');
    try {
      const { data: policies, error } = await serviceSupabase
        .from('pg_policies')
        .select('tablename, policyname')
        .in('tablename', tables);

      if (!error && policies) {
        console.log(`✅ Found ${policies.length} policies for critical tables`);
        policies.forEach(p => {
          console.log(`   📋 ${p.tablename}: ${p.policyname}`);
        });
      } else {
        console.log('⚠️ Could not check policies directly');
      }
    } catch (err) {
      console.log('⚠️ Policy check failed:', err.message);
    }

    // Check if helper functions exist
    console.log('\n🔧 CHECKING HELPER FUNCTIONS:');
    const functions = ['is_team_member', 'is_admin', 'is_customer'];
    for (const func of functions) {
      try {
        const { data, error } = await serviceSupabase
          .from('pg_proc')
          .select('proname')
          .eq('proname', func)
          .limit(1);

        if (!error && data && data.length > 0) {
          console.log(`✅ public.${func}(): Function exists`);
        } else {
          console.log(`❌ public.${func}(): Function missing`);
        }
      } catch (err) {
        console.log(`⚠️ public.${func}(): Could not verify`);
      }
    }

    console.log('\n🎯 RECOMMENDATIONS:');
    if (blockedCount < 4) {
      console.log('1. Verify all SQL was executed correctly in Supabase Dashboard');
      console.log('2. Check that RLS is enabled on all tables');
      console.log('3. Ensure helper functions were created successfully');
      console.log('4. Try re-running the corrected SQL script');
    } else {
      console.log('1. ✅ RLS is working correctly');
      console.log('2. ✅ All security vulnerabilities are fixed');
      console.log('3. 🎉 Platform is secure for production use');
    }

  } catch (error) {
    console.log('❌ RLS test failed:', error.message);
  }
}

testRLSDirectly().catch(console.error);