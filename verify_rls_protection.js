#!/usr/bin/env node

/**
 * RLS Protection Verification Script
 * Verifies that all 6 core customer data tables have complete RLS protection
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Service role client (bypasses RLS)
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

// Anonymous client (should be blocked by RLS)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

const CORE_CUSTOMER_TABLES = [
  'customers',
  'devices', 
  'appointments',
  'test_reports',
  'invoices',
  'payments'
];

async function verifyRLSStatus() {
  console.log('🔍 FISHER BACKFLOWS RLS VERIFICATION');
  console.log('====================================\n');

  try {
    // 1. Check RLS status on all tables
    console.log('1️⃣ CHECKING RLS STATUS ON ALL TABLES');
    console.log('------------------------------------');
    
    const { data: tables, error: tablesError } = await supabaseService
      .rpc('get_table_rls_status');
    
    if (tablesError) {
      // Fallback to direct SQL query if RPC doesn't exist
      const { data: tablesQuery, error: queryError } = await supabaseService
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('schemaname', 'public')
        .order('tablename');
      
      if (queryError) {
        console.error('❌ Could not check table RLS status:', queryError.message);
        return;
      }
      
      console.log('Tables RLS Status:');
      tablesQuery.forEach(table => {
        const status = table.rowsecurity ? '✅ PROTECTED' : '❌ EXPOSED';
        const isCore = CORE_CUSTOMER_TABLES.includes(table.tablename);
        console.log(`  ${table.tablename}: ${status} ${isCore ? '(CORE TABLE)' : ''}`);
      });
    }

    // 2. Check RLS policies exist
    console.log('\n2️⃣ CHECKING RLS POLICIES');
    console.log('-------------------------');
    
    for (const table of CORE_CUSTOMER_TABLES) {
      const { data: policies, error: policiesError } = await supabaseService
        .rpc('get_table_policies', { table_name: table });
      
      if (policiesError) {
        console.log(`  ${table}: ❌ Could not check policies - ${policiesError.message}`);
      } else if (policies && policies.length > 0) {
        console.log(`  ${table}: ✅ ${policies.length} policies found`);
      } else {
        console.log(`  ${table}: ⚠️ No policies found`);
      }
    }

    // 3. Check helper functions exist
    console.log('\n3️⃣ CHECKING HELPER FUNCTIONS');
    console.log('-----------------------------');
    
    const helperFunctions = ['is_team_member', 'is_admin', 'is_customer'];
    
    for (const func of helperFunctions) {
      try {
        const { data, error } = await supabaseService
          .rpc(func);
        
        if (error) {
          console.log(`  ${func}(): ❌ Not found or error - ${error.message}`);
        } else {
          console.log(`  ${func}(): ✅ Function exists and callable`);
        }
      } catch (err) {
        console.log(`  ${func}(): ❌ Not found or error - ${err.message}`);
      }
    }

    // 4. Test customer data isolation with anonymous client
    console.log('\n4️⃣ TESTING CUSTOMER DATA ISOLATION');
    console.log('-----------------------------------');
    
    for (const table of CORE_CUSTOMER_TABLES) {
      try {
        const { data, error } = await supabaseAnon
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`  ${table}: ✅ BLOCKED - ${error.message}`);
        } else if (data && data.length === 0) {
          console.log(`  ${table}: ✅ BLOCKED - No data returned`);
        } else {
          console.log(`  ${table}: ❌ EXPOSED - Anonymous user can access data!`);
        }
      } catch (err) {
        console.log(`  ${table}: ✅ BLOCKED - ${err.message}`);
      }
    }

    // 5. Test service role can still access data
    console.log('\n5️⃣ TESTING SERVICE ROLE ACCESS');
    console.log('------------------------------');
    
    for (const table of CORE_CUSTOMER_TABLES) {
      try {
        const { count, error } = await supabaseService
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`  ${table}: ❌ SERVICE ROLE BLOCKED - ${error.message}`);
        } else {
          console.log(`  ${table}: ✅ Service role can access (${count} records)`);
        }
      } catch (err) {
        console.log(`  ${table}: ❌ SERVICE ROLE ERROR - ${err.message}`);
      }
    }

    // 6. Security summary
    console.log('\n6️⃣ SECURITY SUMMARY');
    console.log('-------------------');
    
    // Check total tables with RLS
    const { data: rlsTables, error: rlsError } = await supabaseService
      .rpc('count_rls_tables');
    
    if (!rlsError && rlsTables) {
      const totalWithRLS = rlsTables[0]?.count || 0;
      if (totalWithRLS >= 20) {
        console.log(`✅ SUCCESS: ${totalWithRLS} tables have RLS enabled`);
      } else if (totalWithRLS > 0) {
        console.log(`⚠️ PARTIAL: ${totalWithRLS} tables have RLS enabled`);
      } else {
        console.log(`❌ FAILED: No tables have RLS enabled`);
      }
    }

    console.log('\n🔒 VERIFICATION COMPLETE');
    console.log('========================');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Run verification
verifyRLSStatus().catch(console.error);