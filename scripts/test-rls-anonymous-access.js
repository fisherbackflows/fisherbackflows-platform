#!/usr/bin/env node

/**
 * ANONYMOUS ACCESS TEST
 * This script tests if anonymous users can access customer data
 * If RLS is working correctly, all queries should fail with permission errors
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Create ANONYMOUS client (using anon key, not service role)
const anonSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Create SERVICE ROLE client for comparison
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CORE_CUSTOMER_TABLES = [
  'customers',
  'devices', 
  'appointments',
  'test_reports',
  'invoices',
  'payments'
];

const SECURITY_ADVISORY_TABLES = [
  'billing_invoices',
  'security_logs', 
  'technician_locations',
  'technician_current_location'
];

async function testAnonymousAccess(tableName) {
  try {
    console.log(`Testing anonymous access to ${tableName}...`);
    
    const { data, error } = await anonSupabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      // Check if it's an RLS/permission error
      if (error.message.includes('row-level security') || 
          error.message.includes('permission denied') ||
          error.message.includes('insufficient_privilege') ||
          error.message.includes('policy')) {
        return {
          table: tableName,
          protected: true,
          status: 'RLS ACTIVE - Access Denied',
          detail: error.message
        };
      } else if (error.message.includes('does not exist')) {
        return {
          table: tableName,
          protected: null,
          status: 'Table Missing',
          detail: 'Table does not exist'
        };
      } else {
        return {
          table: tableName,
          protected: false,
          status: 'Other Error',
          detail: error.message
        };
      }
    } else {
      // Anonymous query succeeded - this is BAD!
      return {
        table: tableName,
        protected: false,
        status: 'VULNERABLE - Data Accessible',
        detail: `Anonymous user can access ${data?.length || 0} rows`
      };
    }
  } catch (err) {
    if (err.message.includes('row-level security') || 
        err.message.includes('permission denied') ||
        err.message.includes('policy')) {
      return {
        table: tableName,
        protected: true,
        status: 'RLS ACTIVE - Access Denied',
        detail: err.message
      };
    }
    return {
      table: tableName,
      protected: null,
      status: 'Test Error',
      detail: err.message
    };
  }
}

async function testServiceRoleAccess(tableName) {
  try {
    const { data, error } = await serviceSupabase
      .from(tableName)
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist')) {
        return { accessible: false, detail: 'Table does not exist' };
      }
      return { accessible: false, detail: error.message };
    }
    
    return { accessible: true, detail: `Can access data (${data?.length || 0} rows)` };
  } catch (err) {
    return { accessible: false, detail: err.message };
  }
}

async function checkRLSStatus() {
  try {
    // Use service role to check RLS status directly
    const { data: rlsInfo, error } = await serviceSupabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .in('tablename', [...CORE_CUSTOMER_TABLES, ...SECURITY_ADVISORY_TABLES]);
    
    if (error) {
      console.log('⚠️  Could not query pg_tables directly');
      return null;
    }
    
    return rlsInfo;
  } catch (err) {
    console.log('⚠️  Could not check RLS status directly');
    return null;
  }
}

async function main() {
  console.log('🔒 FISHER BACKFLOWS RLS VERIFICATION');
  console.log('🎯 Testing Anonymous Access Protection');
  console.log('📅 ' + new Date().toISOString());
  console.log('='.repeat(70));
  
  console.log('\n🔍 Testing database access methods...');
  console.log(`Anonymous Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...`);
  console.log(`Service Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20)}...`);
  
  // Check RLS status from database
  console.log('\n📊 Checking RLS Status in Database...');
  const rlsInfo = await checkRLSStatus();
  
  if (rlsInfo) {
    console.log('RLS Status from pg_tables:');
    rlsInfo.forEach(table => {
      const status = table.rowsecurity ? '✅ ENABLED' : '❌ DISABLED';
      console.log(`  ${table.tablename}: ${status}`);
    });
  }
  
  console.log('\n🔐 Testing Anonymous Access to Core Customer Tables...');
  console.log('=' .repeat(70));
  
  const coreResults = [];
  for (const tableName of CORE_CUSTOMER_TABLES) {
    const result = await testAnonymousAccess(tableName);
    coreResults.push(result);
    
    const statusIcon = 
      result.protected === true ? '✅' :
      result.protected === false ? '🚨' : '⚠️';
    
    console.log(`${statusIcon} ${result.table}: ${result.status}`);
    if (result.detail && !result.detail.includes('permission denied')) {
      console.log(`   Details: ${result.detail}`);
    }
  }
  
  console.log('\n🛡️  Testing Security Advisory Tables...');
  console.log('=' .repeat(70));
  
  const advisoryResults = [];
  for (const tableName of SECURITY_ADVISORY_TABLES) {
    const result = await testAnonymousAccess(tableName);
    advisoryResults.push(result);
    
    const statusIcon = 
      result.protected === true ? '✅' :
      result.protected === false ? '🚨' : '⚠️';
    
    console.log(`${statusIcon} ${result.table}: ${result.status}`);
    if (result.detail && !result.detail.includes('permission denied')) {
      console.log(`   Details: ${result.detail}`);
    }
  }
  
  console.log('\n🔧 Testing Service Role Access...');
  console.log('=' .repeat(70));
  
  const allTables = [...CORE_CUSTOMER_TABLES, ...SECURITY_ADVISORY_TABLES];
  const serviceRoleWorking = [];
  
  for (const tableName of allTables) {
    const result = await testServiceRoleAccess(tableName);
    serviceRoleWorking.push({ table: tableName, ...result });
    
    const statusIcon = result.accessible ? '✅' : '❌';
    console.log(`${statusIcon} ${tableName}: ${result.detail}`);
  }
  
  // Generate Summary Report
  console.log('\n📊 SECURITY VERIFICATION SUMMARY');
  console.log('='.repeat(70));
  
  const coreProtected = coreResults.filter(r => r.protected === true).length;
  const coreVulnerable = coreResults.filter(r => r.protected === false).length;
  const coreMissing = coreResults.filter(r => r.protected === null).length;
  
  const advisoryProtected = advisoryResults.filter(r => r.protected === true).length;
  const advisoryVulnerable = advisoryResults.filter(r => r.protected === false).length;
  const advisoryMissing = advisoryResults.filter(r => r.protected === null).length;
  
  const serviceWorking = serviceRoleWorking.filter(r => r.accessible === true).length;
  
  console.log(`\n🎯 CORE CUSTOMER TABLES (${CORE_CUSTOMER_TABLES.length} total):`);
  console.log(`   ✅ Protected: ${coreProtected}`);
  console.log(`   🚨 Vulnerable: ${coreVulnerable}`);
  console.log(`   ⚠️  Missing: ${coreMissing}`);
  
  console.log(`\n🛡️  SECURITY ADVISORY TABLES (${SECURITY_ADVISORY_TABLES.length} total):`);
  console.log(`   ✅ Protected: ${advisoryProtected}`);
  console.log(`   🚨 Vulnerable: ${advisoryVulnerable}`);
  console.log(`   ⚠️  Missing: ${advisoryMissing}`);
  
  console.log(`\n🔧 SERVICE ROLE ACCESS:`);
  console.log(`   ✅ Working: ${serviceWorking}/${allTables.length} tables`);
  
  const totalProtected = coreProtected + advisoryProtected;
  const totalVulnerable = coreVulnerable + advisoryVulnerable;
  const totalTables = CORE_CUSTOMER_TABLES.length + SECURITY_ADVISORY_TABLES.length;
  
  const protectionPercentage = Math.round((totalProtected / totalTables) * 100);
  
  console.log(`\n📈 OVERALL PROTECTION: ${protectionPercentage}% (${totalProtected}/${totalTables})`);
  
  // Critical Assessment
  console.log('\n🎯 CRITICAL SECURITY ASSESSMENT');
  console.log('='.repeat(70));
  
  if (totalVulnerable === 0) {
    console.log('✅ EXCELLENT: All customer data is protected from anonymous access');
    console.log('✅ RLS policies are working correctly');
  } else {
    console.log(`🚨 CRITICAL SECURITY VULNERABILITY DETECTED!`);
    console.log(`🚨 ${totalVulnerable} tables are accessible to anonymous users`);
    console.log('🚨 Customer data is at risk of unauthorized access');
  }
  
  if (serviceWorking < allTables.length) {
    console.log(`⚠️  Service role access issues detected (${serviceWorking}/${allTables.length})`);
    console.log('⚠️  API operations may not function correctly');
  } else {
    console.log('✅ Service role access is working properly');
  }
  
  console.log('\n📋 VULNERABILITY DETAILS:');
  if (coreVulnerable > 0) {
    console.log('🚨 CORE CUSTOMER DATA VULNERABILITIES:');
    coreResults.filter(r => r.protected === false).forEach(r => {
      console.log(`   • ${r.table}: ${r.detail}`);
    });
  }
  
  if (advisoryVulnerable > 0) {
    console.log('🚨 SECURITY ADVISORY VULNERABILITIES:');
    advisoryResults.filter(r => r.protected === false).forEach(r => {
      console.log(`   • ${r.table}: ${r.detail}`);
    });
  }
  
  console.log('\n🎯 NEXT STEPS:');
  if (totalVulnerable > 0) {
    console.log('1. 🚨 IMMEDIATE ACTION REQUIRED: Execute RLS policies');
    console.log('2. 🔧 Go to Supabase SQL Editor');
    console.log('3. 📋 Execute the comprehensive RLS implementation');
    console.log('4. 🔍 Re-run this verification script');
    console.log('5. 🧪 Test customer portal access');
  } else {
    console.log('1. ✅ RLS protection is working correctly');
    console.log('2. 🧪 Test customer portal functionality');
    console.log('3. 📊 Monitor application logs');
    console.log('4. 🔄 Regular security audits recommended');
  }
  
  console.log('\n🏁 VERIFICATION COMPLETE');
  console.log('='.repeat(70));
  
  // Exit with appropriate code
  process.exit(totalVulnerable > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error.message);
  console.error(error.stack);
  process.exit(1);
});