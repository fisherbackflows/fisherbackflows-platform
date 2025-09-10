#!/usr/bin/env node

/**
 * RLS Policy Checker - Fisher Backflows
 * Analyzes current RLS policies and identifies missing ones
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS policies for all tables...\n');

  try {
    // Get all tables with RLS enabled
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .not('table_name', 'like', 'pg_%')
      .not('table_name', 'like', 'information_schema%');

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      return;
    }

    // Get RLS status for all tables
    const { data: rlsStatus, error: rlsError } = await supabase.rpc('check_rls_status');
    
    if (rlsError) {
      // If the function doesn't exist, we'll use a different approach
      console.log('Using alternative method to check RLS status...');
      await checkRLSAlternative();
      return;
    }

    console.log('RLS Status Report:');
    console.log('='.repeat(50));
    
    rlsStatus.forEach(table => {
      const status = table.rls_enabled ? '✅' : '❌';
      const policies = table.policy_count || 0;
      console.log(`${status} ${table.table_name}: RLS ${table.rls_enabled ? 'enabled' : 'disabled'}, ${policies} policies`);
    });

  } catch (error) {
    console.error('Error checking RLS policies:', error);
    await checkRLSAlternative();
  }
}

async function checkRLSAlternative() {
  console.log('📋 Checking RLS status using direct queries...\n');

  // Core tables that should have RLS
  const criticalTables = [
    'customers',
    'team_users', 
    'devices',
    'appointments',
    'test_reports',
    'invoices',
    'payments',
    'billing_subscriptions',
    'billing_invoices',
    'security_logs',
    'technician_locations',
    'technician_current_location',
    'audit_logs',
    'email_verifications',
    'leads',
    'time_off_requests',
    'tester_schedules',
    'team_sessions',
    'water_districts',
    'water_department_submissions',
    'notification_templates',
    'push_subscriptions',
    'notification_logs',
    'notification_interactions'
  ];

  const results = {
    withRLS: [],
    withoutRLS: [],
    withRLSNoPolicies: [],
    errors: []
  };

  for (const tableName of criticalTables) {
    try {
      // Check if RLS is enabled
      const { data: rlsCheck } = await supabase
        .from('pg_class')
        .select('relrowsecurity')
        .eq('relname', tableName)
        .single();

      const rlsEnabled = rlsCheck?.relrowsecurity || false;

      if (rlsEnabled) {
        // Check for existing policies
        const { data: policies } = await supabase
          .from('pg_policies')
          .select('policyname, cmd, permissive, roles, qual, with_check')
          .eq('tablename', tableName);

        if (policies && policies.length > 0) {
          results.withRLS.push({
            table: tableName,
            policyCount: policies.length,
            policies: policies
          });
        } else {
          results.withRLSNoPolicies.push(tableName);
        }
      } else {
        results.withoutRLS.push(tableName);
      }

    } catch (error) {
      results.errors.push({ table: tableName, error: error.message });
    }
  }

  // Print results
  console.log('📊 RLS Policy Analysis Results:');
  console.log('='.repeat(50));

  console.log(`\n✅ Tables with RLS and policies (${results.withRLS.length}):`);
  results.withRLS.forEach(table => {
    console.log(`   ${table.table} (${table.policyCount} policies)`);
  });

  console.log(`\n⚠️  Tables with RLS but NO policies (${results.withRLSNoPolicies.length}):`);
  results.withRLSNoPolicies.forEach(table => {
    console.log(`   ${table}`);
  });

  console.log(`\n❌ Tables WITHOUT RLS (${results.withoutRLS.length}):`);
  results.withoutRLS.forEach(table => {
    console.log(`   ${table}`);
  });

  if (results.errors.length > 0) {
    console.log(`\n🔥 Errors checking tables (${results.errors.length}):`);
    results.errors.forEach(error => {
      console.log(`   ${error.table}: ${error.error}`);
    });
  }

  // Security recommendations
  console.log('\n🔒 Security Recommendations:');
  console.log('='.repeat(30));

  if (results.withRLSNoPolicies.length > 0) {
    console.log('🚨 CRITICAL: Tables with RLS enabled but no policies block ALL access!');
    console.log('   These tables need immediate policy creation:');
    results.withRLSNoPolicies.forEach(table => {
      console.log(`   - ${table}`);
    });
  }

  if (results.withoutRLS.length > 0) {
    console.log('⚠️  WARNING: Tables without RLS are publicly accessible!');
    console.log('   Consider enabling RLS for sensitive tables.');
  }

  console.log(`\n📈 RLS Coverage: ${results.withRLS.length}/${criticalTables.length} tables (${((results.withRLS.length / criticalTables.length) * 100).toFixed(1)}%)`);

  return results;
}

// Create SQL to enable RLS and basic policies
async function generateRLSSQL(results) {
  console.log('\n📝 Generating RLS policy SQL...');
  
  const sqlStatements = [];

  // Enable RLS for tables that don't have it
  if (results && results.withoutRLS) {
    results.withoutRLS.forEach(table => {
      sqlStatements.push(`-- Enable RLS for ${table}`);
      sqlStatements.push(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
      sqlStatements.push('');
    });
  }

  // Generate basic policies for tables with RLS but no policies
  if (results && results.withRLSNoPolicies) {
    results.withRLSNoPolicies.forEach(table => {
      sqlStatements.push(`-- Basic policies for ${table}`);
      
      // Different policy patterns based on table type
      if (table.includes('customer') || table === 'devices' || table === 'appointments') {
        // Customer-owned data
        sqlStatements.push(`CREATE POLICY "${table}_customer_access" ON public.${table}`);
        sqlStatements.push(`  FOR ALL USING (customer_id = auth.uid()::uuid);`);
      } else if (table.includes('team') || table.includes('technician')) {
        // Team/admin only data
        sqlStatements.push(`CREATE POLICY "${table}_team_access" ON public.${table}`);
        sqlStatements.push(`  FOR ALL USING (`);
        sqlStatements.push(`    EXISTS (`);
        sqlStatements.push(`      SELECT 1 FROM public.team_users`);
        sqlStatements.push(`      WHERE user_id = auth.uid()::uuid`);
        sqlStatements.push(`        AND role IN ('admin', 'manager', 'tester')`);
        sqlStatements.push(`    )`);
        sqlStatements.push(`  );`);
      } else if (table.includes('audit') || table.includes('security') || table.includes('log')) {
        // Admin-only data
        sqlStatements.push(`CREATE POLICY "${table}_admin_access" ON public.${table}`);
        sqlStatements.push(`  FOR ALL USING (`);
        sqlStatements.push(`    EXISTS (`);
        sqlStatements.push(`      SELECT 1 FROM public.team_users`);
        sqlStatements.push(`      WHERE user_id = auth.uid()::uuid`);
        sqlStatements.push(`        AND role = 'admin'`);
        sqlStatements.push(`    )`);
        sqlStatements.push(`  );`);
      } else {
        // Generic authenticated user policy
        sqlStatements.push(`CREATE POLICY "${table}_authenticated_access" ON public.${table}`);
        sqlStatements.push(`  FOR ALL USING (auth.role() = 'authenticated');`);
      }
      
      sqlStatements.push('');
    });
  }

  // Write SQL to file
  const fs = require('fs');
  const sqlContent = sqlStatements.join('\n');
  const filename = `rls-policies-${Date.now()}.sql`;
  
  fs.writeFileSync(filename, sqlContent);
  console.log(`📄 RLS policy SQL written to: ${filename}`);
  
  return filename;
}

// Main execution
async function main() {
  try {
    const results = await checkRLSAlternative();
    await generateRLSSQL(results);
    
    console.log('\n✅ RLS policy check completed');
    console.log('📋 Review the generated SQL file before applying to production');
    
  } catch (error) {
    console.error('❌ RLS check failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkRLSPolicies, checkRLSAlternative };