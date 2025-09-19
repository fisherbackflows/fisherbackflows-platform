#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Supabase configuration
const supabaseUrl = 'https://jvhbqfueutvfepsjmztx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  console.error('Please ensure .env.local has the correct service role key');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase with service role...');
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Define all 25 tables that should have RLS
const ALL_TABLES = [
  'customers', 'devices', 'appointments', 'test_reports', 'invoices', 'payments',
  'team_users', 'team_sessions', 'technician_locations', 'technician_current_location',
  'time_off_requests', 'tester_schedules', 'security_logs', 'audit_logs',
  'email_verifications', 'billing_subscriptions', 'billing_invoices', 
  'invoice_line_items', 'water_districts', 'water_department_submissions',
  'leads', 'notification_templates', 'push_subscriptions', 'notification_logs',
  'notification_interactions'
];

// Define security advisory tables that must have RLS
const SECURITY_ADVISORY_TABLES = [
  'billing_invoices',
  'security_logs', 
  'technician_locations',
  'technician_current_location'
];

async function testConnection() {
    try {
        console.log('🔍 Testing database connection...');
        const { data, error } = await supabase
            .from('customers')
            .select('id')
            .limit(1);
        
        if (error && !error.message.includes('row-level security')) {
            console.error('❌ Connection test failed:', error.message);
            return false;
        }
        
        console.log('✅ Database connection successful');
        return true;
    } catch (err) {
        console.error('❌ Connection error:', err.message);
        return false;
    }
}

async function checkTableExists(tableName) {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
        
        if (error && error.message.includes('does not exist')) {
            return false;
        }
        
        return true;
    } catch (err) {
        return false;
    }
}

async function checkRLSEnabled(tableName) {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
        
        // If we get a row-level security error, RLS is enabled
        if (error && error.message.includes('row-level security')) {
            return { enabled: true, message: 'RLS enabled (blocked by policies)' };
        }
        
        // If we get data or other error, RLS may not be enabled
        if (!error || data) {
            return { enabled: false, message: 'RLS not enabled (or service role bypass)' };
        }
        
        return { enabled: false, message: `Unknown: ${error.message}` };
        
    } catch (err) {
        if (err.message.includes('row-level security')) {
            return { enabled: true, message: 'RLS enabled (blocked by policies)' };
        }
        return { enabled: false, message: `Error: ${err.message}` };
    }
}

async function checkHelperFunctions() {
    console.log('\n🔧 Checking Helper Functions...');
    console.log('=' .repeat(50));
    
    const helperFunctions = [
        'auth.is_team_member()',
        'auth.is_admin()', 
        'auth.is_customer()'
    ];
    
    let functionsExist = 0;
    
    for (const func of helperFunctions) {
        try {
            // Try to use the function in a simple query
            const { data, error } = await supabase
                .from('customers')
                .select('id')
                .limit(1);
                
            // For now, we'll assume functions exist if we can connect
            // (checking functions requires special queries we can't run via REST API)
            console.log(`⚠️  ${func}: Cannot verify via API (manual check needed)`);
        } catch (err) {
            console.log(`❌ ${func}: Cannot verify - ${err.message}`);
        }
    }
    
    console.log('\n📋 Helper functions need manual verification in Supabase SQL Editor');
    console.log('   Run: SELECT routine_name FROM information_schema.routines WHERE routine_schema = \'auth\';');
}

async function checkRLSImplementation() {
    console.log('\n🛡️  RLS Implementation Status...');
    console.log('=' .repeat(50));
    
    const results = {
        tablesFound: 0,
        rlsEnabled: 0,
        securityAdvisoryFixed: 0,
        missingTables: [],
        noRLS: [],
        errors: []
    };
    
    for (const tableName of ALL_TABLES) {
        const exists = await checkTableExists(tableName);
        
        if (!exists) {
            results.missingTables.push(tableName);
            console.log(`⚠️  ${tableName}: Table does not exist`);
            continue;
        }
        
        results.tablesFound++;
        
        const rlsStatus = await checkRLSEnabled(tableName);
        
        if (rlsStatus.enabled) {
            results.rlsEnabled++;
            
            // Check if this is a security advisory table
            if (SECURITY_ADVISORY_TABLES.includes(tableName)) {
                results.securityAdvisoryFixed++;
            }
            
            console.log(`✅ ${tableName}: ${rlsStatus.message}`);
        } else {
            results.noRLS.push(tableName);
            console.log(`❌ ${tableName}: ${rlsStatus.message}`);
        }
    }
    
    return results;
}

async function generateManualInstructions() {
    console.log('\n📋 MANUAL EXECUTION INSTRUCTIONS');
    console.log('=' .repeat(50));
    console.log('Since Supabase REST API does not support DDL operations,');
    console.log('you must execute the RLS policies manually using the Supabase Dashboard.');
    console.log('');
    console.log('🔧 STEPS TO EXECUTE:');
    console.log('1. Go to https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Create a new query');
    console.log('4. Copy and paste the COMPREHENSIVE_RLS_IMPLEMENTATION.sql file contents');
    console.log('5. Execute the SQL (it may take a few minutes)');
    console.log('');
    console.log('⚠️  IMPORTANT NOTES:');
    console.log('• Execute sections one at a time if you encounter errors');
    console.log('• Some policies may already exist (this is OK - they will be skipped)');
    console.log('• Some tables may not exist in your database (this is OK)');
    console.log('• The service role automatically bypasses all RLS policies');
    console.log('');
    console.log('🔍 VERIFICATION:');
    console.log('After execution, run this script again to verify the implementation.');
}

async function generateSecurityReport(results) {
    console.log('\n🛡️  SECURITY ADVISORY STATUS');
    console.log('=' .repeat(50));
    
    console.log('Based on Supabase security advisories, these tables MUST have RLS:');
    console.log('');
    
    for (const table of SECURITY_ADVISORY_TABLES) {
        const hasRLS = !results.noRLS.includes(table) && !results.missingTables.includes(table);
        const status = hasRLS ? '✅ SECURED' : '❌ VULNERABLE';
        console.log(`${status} ${table}`);
        
        if (!hasRLS) {
            console.log(`   ⚠️  This table needs RLS policies immediately!`);
        }
    }
    
    const advisoryFixed = results.securityAdvisoryFixed;
    const advisoryTotal = SECURITY_ADVISORY_TABLES.length;
    
    console.log('');
    console.log(`📊 Security Advisory Compliance: ${advisoryFixed}/${advisoryTotal} tables secured`);
    
    if (advisoryFixed < advisoryTotal) {
        console.log('❌ CRITICAL: Security vulnerabilities detected!');
        console.log('   Execute the RLS implementation immediately.');
    } else {
        console.log('✅ All security advisory tables are properly secured.');
    }
}

async function main() {
    console.log('🚀 COMPREHENSIVE RLS VERIFICATION REPORT');
    console.log('🎯 Fisher Backflows Platform - Security Status Check');
    console.log('📅 ' + new Date().toISOString());
    console.log('=' .repeat(80));
    
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
        console.log('\n❌ Could not connect to database. Please check:');
        console.log('1. SUPABASE_SERVICE_ROLE_KEY in .env.local');
        console.log('2. Network connectivity to Supabase');
        console.log('3. Service role key permissions');
        process.exit(1);
    }
    
    // Check helper functions
    await checkHelperFunctions();
    
    // Check RLS implementation
    const results = await checkRLSImplementation();
    
    // Generate security report
    await generateSecurityReport(results);
    
    // Overall summary
    console.log('\n📊 OVERALL IMPLEMENTATION STATUS');
    console.log('=' .repeat(50));
    console.log(`📋 Tables Found: ${results.tablesFound}/${ALL_TABLES.length}`);
    console.log(`🛡️  RLS Enabled: ${results.rlsEnabled}/${results.tablesFound} tables`);
    console.log(`⚠️  Missing Tables: ${results.missingTables.length}`);
    console.log(`❌ No RLS: ${results.noRLS.length} tables`);
    
    if (results.missingTables.length > 0) {
        console.log('\n⚠️  MISSING TABLES:');
        results.missingTables.forEach(table => console.log(`   • ${table}`));
    }
    
    if (results.noRLS.length > 0) {
        console.log('\n❌ TABLES WITHOUT RLS:');
        results.noRLS.forEach(table => console.log(`   • ${table}`));
    }
    
    const rlsPercentage = results.tablesFound > 0 ? Math.round((results.rlsEnabled / results.tablesFound) * 100) : 0;
    console.log(`\n📈 RLS Coverage: ${rlsPercentage}% of existing tables`);
    
    // Generate instructions for manual execution
    await generateManualInstructions();
    
    console.log('\n🎯 NEXT STEPS:');
    if (results.rlsEnabled < results.tablesFound) {
        console.log('1. ❗ Execute COMPREHENSIVE_RLS_IMPLEMENTATION.sql in Supabase SQL Editor');
        console.log('2. 🔍 Run this verification script again to confirm implementation');
        console.log('3. 🧪 Test customer and team portals for proper data isolation');
        console.log('4. 📊 Monitor application logs for RLS policy violations');
    } else {
        console.log('1. ✅ RLS implementation appears complete!');
        console.log('2. 🧪 Test customer and team portals for proper data isolation');
        console.log('3. 📊 Monitor application logs for any access issues');
        console.log('4. 🔒 Regularly audit RLS policies for effectiveness');
    }
    
    console.log('\n🏁 VERIFICATION REPORT COMPLETE');
    console.log('=' .repeat(50));
    
    // Exit with appropriate code
    const criticalIssues = SECURITY_ADVISORY_TABLES.filter(table => 
        results.noRLS.includes(table) || results.missingTables.includes(table)
    ).length;
    
    if (criticalIssues > 0) {
        console.log(`❌ ${criticalIssues} critical security issues detected!`);
        process.exit(1);
    } else {
        console.log('✅ No critical security issues detected.');
        process.exit(0);
    }
}

main().catch((error) => {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
});