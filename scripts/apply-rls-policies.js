#!/usr/bin/env node

/**
 * RLS Policy Application Script - Fisher Backflows
 * Safely applies RLS policies with validation and rollback capability
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

class RLSPolicyManager {
  constructor() {
    this.backupFile = `rls-backup-${Date.now()}.sql`;
    this.appliedPolicies = [];
  }

  async backupExistingPolicies() {
    console.log('💾 Creating backup of existing RLS policies...');
    
    try {
      // Get existing policies
      const { data: policies, error } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('schemaname', 'public');

      if (error) {
        console.error('Error fetching existing policies:', error);
        return false;
      }

      // Get RLS status for tables
      const { data: tables, error: tablesError } = await supabase
        .from('pg_class')
        .select('relname, relrowsecurity')
        .eq('relnamespace', 'public'::regnamespace);

      if (tablesError) {
        console.error('Error fetching table RLS status:', tablesError);
        return false;
      }

      // Generate backup SQL
      let backupSQL = '-- RLS Policy Backup\n';
      backupSQL += `-- Generated: ${new Date().toISOString()}\n\n`;

      // Backup table RLS status
      backupSQL += '-- Table RLS Status\n';
      tables?.forEach(table => {
        if (table.relrowsecurity) {
          backupSQL += `ALTER TABLE public.${table.relname} ENABLE ROW LEVEL SECURITY;\n`;
        } else {
          backupSQL += `ALTER TABLE public.${table.relname} DISABLE ROW LEVEL SECURITY;\n`;
        }
      });

      backupSQL += '\n-- Existing Policies\n';
      policies?.forEach(policy => {
        backupSQL += `CREATE POLICY "${policy.policyname}" ON public.${policy.tablename}\n`;
        backupSQL += `  FOR ${policy.cmd} USING (${policy.qual || 'true'})`;
        if (policy.with_check) {
          backupSQL += `\n  WITH CHECK (${policy.with_check})`;
        }
        backupSQL += ';\n\n';
      });

      fs.writeFileSync(this.backupFile, backupSQL);
      console.log(`✅ Backup created: ${this.backupFile}`);
      return true;

    } catch (error) {
      console.error('Backup failed:', error);
      return false;
    }
  }

  async validatePrerequisites() {
    console.log('🔍 Validating prerequisites...');

    try {
      // Check if we can connect and have necessary permissions
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(1);

      if (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
      }

      // Check for critical tables
      const criticalTables = ['customers', 'team_users', 'devices', 'appointments'];
      for (const table of criticalTables) {
        const { data: tableExists } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', table)
          .single();

        if (!tableExists) {
          console.error(`❌ Critical table missing: ${table}`);
          return false;
        }
      }

      console.log('✅ Prerequisites validated');
      return true;

    } catch (error) {
      console.error('❌ Validation failed:', error);
      return false;
    }
  }

  async applyPoliciesFromFile(filePath) {
    console.log(`📄 Reading policies from: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Policy file not found: ${filePath}`);
      return false;
    }

    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.startsWith('/*'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (!statement.trim()) continue;

      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        // Execute the SQL statement
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          console.error(`❌ Statement ${i + 1} failed:`, error.message);
          console.error(`SQL: ${statement.substring(0, 100)}...`);
          errorCount++;
          
          // For critical errors, we might want to stop
          if (error.message.includes('permission denied') || 
              error.message.includes('does not exist')) {
            console.error('💥 Critical error encountered, stopping execution');
            break;
          }
        } else {
          successCount++;
          this.appliedPolicies.push(statement);
        }

        // Brief pause between statements
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`💥 Unexpected error in statement ${i + 1}:`, error);
        errorCount++;
      }
    }

    console.log(`\n📊 Execution Summary:`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Failed: ${errorCount}`);
    console.log(`   Total: ${statements.length}`);

    return errorCount === 0;
  }

  async testPolicies() {
    console.log('🧪 Testing applied RLS policies...');

    const tests = [
      {
        name: 'Check RLS enabled on customers table',
        sql: "SELECT relrowsecurity FROM pg_class WHERE relname = 'customers'",
        expected: true
      },
      {
        name: 'Count policies on customers table',
        sql: "SELECT COUNT(*) as count FROM pg_policies WHERE tablename = 'customers'",
        expectedMin: 1
      },
      {
        name: 'Check helper functions exist',
        sql: "SELECT COUNT(*) as count FROM pg_proc WHERE proname = 'is_team_member'",
        expectedMin: 1
      }
    ];

    let passedTests = 0;

    for (const test of tests) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: test.sql });
        
        if (error) {
          console.log(`❌ ${test.name}: Error - ${error.message}`);
          continue;
        }

        let passed = false;
        
        if (test.expected !== undefined) {
          passed = data?.[0]?.relrowsecurity === test.expected;
        } else if (test.expectedMin !== undefined) {
          passed = (data?.[0]?.count || 0) >= test.expectedMin;
        }

        if (passed) {
          console.log(`✅ ${test.name}: PASSED`);
          passedTests++;
        } else {
          console.log(`❌ ${test.name}: FAILED - Expected ${test.expected || `>=${test.expectedMin}`}, got ${JSON.stringify(data)}`);
        }

      } catch (error) {
        console.log(`❌ ${test.name}: Exception - ${error.message}`);
      }
    }

    console.log(`\n🧪 Test Results: ${passedTests}/${tests.length} passed`);
    return passedTests === tests.length;
  }

  async generateStatusReport() {
    console.log('📋 Generating RLS status report...');

    try {
      // Get all tables and their RLS status
      const { data: tables, error: tablesError } = await supabase
        .from('pg_class')
        .select('relname, relrowsecurity')
        .eq('relkind', 'r') // Only regular tables
        .not('relname', 'like', 'pg_%')
        .order('relname');

      if (tablesError) {
        console.error('Error fetching tables:', tablesError);
        return;
      }

      // Get policy counts per table
      const { data: policyCounts, error: policyError } = await supabase
        .from('pg_policies')
        .select('tablename, count(*)')
        .eq('schemaname', 'public')
        .group('tablename');

      if (policyError) {
        console.error('Error fetching policy counts:', policyError);
        return;
      }

      const policyMap = {};
      policyCounts?.forEach(pc => {
        policyMap[pc.tablename] = pc.count;
      });

      console.log('\n📊 RLS STATUS REPORT');
      console.log('='.repeat(60));
      console.log('Table Name'.padEnd(30) + 'RLS Enabled'.padEnd(15) + 'Policies');
      console.log('-'.repeat(60));

      let totalTables = 0;
      let tablesWithRLS = 0;
      let tablesWithPolicies = 0;

      tables?.forEach(table => {
        totalTables++;
        const rlsStatus = table.relrowsecurity ? '✅ Yes' : '❌ No';
        const policyCount = policyMap[table.relname] || 0;
        
        if (table.relrowsecurity) tablesWithRLS++;
        if (policyCount > 0) tablesWithPolicies++;

        console.log(
          table.relname.padEnd(30) + 
          rlsStatus.padEnd(15) + 
          policyCount.toString()
        );
      });

      console.log('-'.repeat(60));
      console.log(`Total Tables: ${totalTables}`);
      console.log(`RLS Enabled: ${tablesWithRLS} (${((tablesWithRLS/totalTables)*100).toFixed(1)}%)`);
      console.log(`With Policies: ${tablesWithPolicies} (${((tablesWithPolicies/totalTables)*100).toFixed(1)}%)`);

      // Generate recommendations
      console.log('\n💡 RECOMMENDATIONS:');
      if (tablesWithRLS < totalTables) {
        console.log(`   - Enable RLS on ${totalTables - tablesWithRLS} remaining tables`);
      }
      if (tablesWithPolicies < tablesWithRLS) {
        console.log(`   - Add policies to ${tablesWithRLS - tablesWithPolicies} tables with RLS enabled`);
      }
      if (tablesWithRLS === totalTables && tablesWithPolicies === tablesWithRLS) {
        console.log('   - ✅ All tables properly secured with RLS and policies!');
      }

    } catch (error) {
      console.error('Error generating status report:', error);
    }
  }

  async run(options = {}) {
    console.log('🔐 Starting RLS Policy Application Process...\n');

    // Step 1: Validate prerequisites
    if (!(await this.validatePrerequisites())) {
      console.error('❌ Prerequisites validation failed');
      process.exit(1);
    }

    // Step 2: Create backup
    if (!(await this.backupExistingPolicies())) {
      console.error('❌ Backup creation failed');
      process.exit(1);
    }

    // Step 3: Apply policies
    const policyFile = options.policyFile || path.join(__dirname, '..', 'database', 'rls-security-policies.sql');
    
    if (!(await this.applyPoliciesFromFile(policyFile))) {
      console.error('❌ Policy application failed');
      console.log(`💾 Restore from backup: ${this.backupFile}`);
      process.exit(1);
    }

    // Step 4: Test policies
    if (!(await this.testPolicies())) {
      console.warn('⚠️  Some policy tests failed - review manually');
    }

    // Step 5: Generate status report
    await this.generateStatusReport();

    console.log('\n✅ RLS Policy application completed successfully!');
    console.log(`💾 Backup available at: ${this.backupFile}`);
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--policy-file' && args[i + 1]) {
      options.policyFile = args[i + 1];
      i++;
    } else if (args[i] === '--test-only') {
      options.testOnly = true;
    } else if (args[i] === '--status-only') {
      options.statusOnly = true;
    }
  }

  const manager = new RLSPolicyManager();

  if (options.statusOnly) {
    await manager.generateStatusReport();
    return;
  }

  if (options.testOnly) {
    await manager.testPolicies();
    return;
  }

  await manager.run(options);
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Application failed:', error);
    process.exit(1);
  });
}

module.exports = RLSPolicyManager;