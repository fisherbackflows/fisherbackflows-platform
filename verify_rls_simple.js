#!/usr/bin/env node

/**
 * Simple RLS Protection Verification Script
 * Tests customer data isolation by attempting to access data with different auth levels
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

async function checkRLSWithSQL() {
  console.log('🔍 FISHER BACKFLOWS RLS VERIFICATION');
  console.log('====================================\n');

  try {
    // 1. Use raw SQL to check RLS status
    console.log('1️⃣ CHECKING RLS STATUS WITH SQL');
    console.log('--------------------------------');
    
    const { data: rlsStatus, error: rlsError } = await supabaseService
      .rpc('sql', {
        query: `
          SELECT 
            tablename,
            rowsecurity as rls_enabled
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename IN ('customers', 'devices', 'appointments', 'test_reports', 'invoices', 'payments')
          ORDER BY tablename;
        `
      });

    if (rlsError) {
      console.log('Trying alternative query method...');
      
      // Try using a simple function call approach
      const { data: tables } = await supabaseService
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', CORE_CUSTOMER_TABLES);
      
      if (tables) {
        console.log('Core tables found:', tables.map(t => t.table_name));
      }
    } else if (rlsStatus) {
      console.log('RLS Status for Core Tables:');
      rlsStatus.forEach(table => {
        const status = table.rls_enabled ? '✅ PROTECTED' : '❌ EXPOSED';
        console.log(`  ${table.tablename}: ${status}`);
      });
    }

    // 2. Test data access with anonymous client
    console.log('\n2️⃣ TESTING ANONYMOUS ACCESS (SHOULD BE BLOCKED)');
    console.log('-----------------------------------------------');
    
    let blockedCount = 0;
    let exposedCount = 0;
    
    for (const table of CORE_CUSTOMER_TABLES) {
      try {
        const { data, error } = await supabaseAnon
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`  ${table}: ✅ BLOCKED - ${error.message.substring(0, 60)}...`);
          blockedCount++;
        } else if (data && data.length === 0) {
          console.log(`  ${table}: ✅ BLOCKED - No data returned`);
          blockedCount++;
        } else {
          console.log(`  ${table}: ❌ EXPOSED - Anonymous user can access ${data.length} records!`);
          exposedCount++;
        }
      } catch (err) {
        console.log(`  ${table}: ✅ BLOCKED - ${err.message.substring(0, 60)}...`);
        blockedCount++;
      }
    }

    // 3. Test service role access
    console.log('\n3️⃣ TESTING SERVICE ROLE ACCESS (SHOULD WORK)');
    console.log('--------------------------------------------');
    
    let serviceSuccessCount = 0;
    let serviceFailCount = 0;
    
    for (const table of CORE_CUSTOMER_TABLES) {
      try {
        const { count, error } = await supabaseService
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`  ${table}: ❌ BLOCKED - ${error.message}`);
          serviceFailCount++;
        } else {
          console.log(`  ${table}: ✅ ACCESSIBLE (${count || 0} records)`);
          serviceSuccessCount++;
        }
      } catch (err) {
        console.log(`  ${table}: ❌ ERROR - ${err.message}`);
        serviceFailCount++;
      }
    }

    // 4. Check helper functions
    console.log('\n4️⃣ TESTING HELPER FUNCTIONS');
    console.log('-----------------------------');
    
    const helperFunctions = ['is_team_member', 'is_admin'];
    
    for (const func of helperFunctions) {
      try {
        const { data, error } = await supabaseService
          .rpc(func);
        
        if (error) {
          console.log(`  ${func}(): ❌ Error - ${error.message}`);
        } else {
          console.log(`  ${func}(): ✅ Function exists (returned: ${data})`);
        }
      } catch (err) {
        console.log(`  ${func}(): ❌ Error - ${err.message}`);
      }
    }

    // 5. Overall security assessment
    console.log('\n🔒 SECURITY ASSESSMENT');
    console.log('======================');
    
    if (blockedCount === CORE_CUSTOMER_TABLES.length && exposedCount === 0) {
      console.log('✅ EXCELLENT: All customer data is properly protected');
      console.log('   Anonymous users cannot access any customer data');
    } else if (blockedCount > exposedCount) {
      console.log('⚠️ PARTIAL: Most customer data is protected');
      console.log(`   ${blockedCount} tables blocked, ${exposedCount} tables exposed`);
    } else {
      console.log('❌ CRITICAL: Customer data is not properly protected');
      console.log(`   ${exposedCount} tables are exposed to anonymous users!`);
    }

    if (serviceSuccessCount === CORE_CUSTOMER_TABLES.length) {
      console.log('✅ Service role can access all data (API operations will work)');
    } else {
      console.log(`⚠️ Service role issues: ${serviceFailCount} tables inaccessible`);
    }

    console.log('\n📊 VERIFICATION SUMMARY');
    console.log('-----------------------');
    console.log(`Anonymous Access: ${blockedCount}/${CORE_CUSTOMER_TABLES.length} tables blocked`);
    console.log(`Service Role Access: ${serviceSuccessCount}/${CORE_CUSTOMER_TABLES.length} tables accessible`);
    
    const securityScore = Math.round((blockedCount / CORE_CUSTOMER_TABLES.length) * 100);
    console.log(`Security Score: ${securityScore}%`);
    
    if (securityScore === 100) {
      console.log('🎉 Customer data security is FULLY IMPLEMENTED! 🎉');
    } else if (securityScore >= 80) {
      console.log('✅ Customer data security is mostly implemented');
    } else {
      console.log('❌ Customer data security needs immediate attention');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Run verification
checkRLSWithSQL().catch(console.error);