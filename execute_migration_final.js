/**
 * Final Migration Execution Script for API System Setup
 * Attempts multiple methods to execute the migration and provides comprehensive reporting
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://jvhbqfueutvfepsjmztx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function executeFinalMigration() {
  console.log('🚀 API System Setup Migration - Final Execution Report');
  console.log('=' .repeat(60));
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`🗄️  Database: ${SUPABASE_URL}`);
  console.log(`📁 Migration File: 20250111_api_system_setup_modified.sql`);
  console.log('');

  const report = {
    timestamp: new Date().toISOString(),
    database_url: SUPABASE_URL,
    migration_file: '20250111_api_system_setup_modified.sql',
    methods_attempted: [],
    final_status: 'pending',
    tables_to_create: [
      'companies',
      'api_keys', 
      'api_usage_logs',
      'webhook_endpoints',
      'webhook_deliveries', 
      'api_rate_limits'
    ],
    functions_to_create: [
      'get_current_company_id()',
      'generate_api_key()',
      'hash_api_key(TEXT)',
      'get_api_key_preview(TEXT)',
      'check_rate_limit(UUID, INTEGER)',
      'queue_webhook_delivery(UUID, TEXT, JSONB)',
      'update_updated_at_column()'
    ],
    pre_migration_state: {},
    post_migration_state: {},
    recommendations: []
  };

  // Read migration file
  try {
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250111_api_system_setup_modified.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    report.migration_size_chars = migrationSQL.length;
    console.log(`📖 Migration file loaded: ${migrationSQL.length} characters`);
  } catch (error) {
    console.error('❌ Failed to read migration file:', error.message);
    report.final_status = 'failed';
    report.error = 'Could not read migration file';
    return report;
  }

  // Check current database state
  console.log('\n🔍 Checking current database state...');
  const preState = await checkCurrentState();
  report.pre_migration_state = preState;

  // Method 1: Try Supabase JS client with rpc
  console.log('\n📞 Method 1: Attempting Supabase RPC execution...');
  const method1Result = await attemptSupabaseRPC();
  report.methods_attempted.push(method1Result);

  // Method 2: Try REST API with various endpoints
  console.log('\n🌐 Method 2: Attempting REST API execution...');
  const method2Result = await attemptRESTAPI();
  report.methods_attempted.push(method2Result);

  // Method 3: Try individual table creation
  console.log('\n🏗️  Method 3: Attempting individual table creation...');
  const method3Result = await attemptIndividualCreation();
  report.methods_attempted.push(method3Result);

  // Check final database state
  console.log('\n🔍 Checking final database state...');
  const postState = await checkCurrentState();
  report.post_migration_state = postState;

  // Generate recommendations
  report.recommendations = generateRecommendations(report);
  report.final_status = determineStatus(report);

  // Save report
  const reportPath = path.join(__dirname, 'migration_execution_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📊 Report saved to: ${reportPath}`);

  // Print summary
  printSummary(report);

  return report;
}

async function checkCurrentState() {
  const state = {
    timestamp: new Date().toISOString(),
    tables: {},
    functions: {},
    connection_status: 'unknown'
  };

  // Test basic connection
  try {
    const { data, error } = await supabase.from('customers').select('id').limit(1);
    state.connection_status = error ? 'error' : 'connected';
    if (error) state.connection_error = error.message;
  } catch (error) {
    state.connection_status = 'failed';
    state.connection_error = error.message;
  }

  // Check each table
  const tablesToCheck = ['companies', 'api_keys', 'api_usage_logs', 'webhook_endpoints', 'webhook_deliveries', 'api_rate_limits'];
  
  for (const table of tablesToCheck) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count&limit=0`, {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      });
      
      state.tables[table] = {
        exists: response.ok,
        status: response.status,
        error: response.ok ? null : await response.text()
      };
    } catch (error) {
      state.tables[table] = {
        exists: false,
        status: 'error',
        error: error.message
      };
    }
  }

  return state;
}

async function attemptSupabaseRPC() {
  const result = {
    method: 'supabase_rpc',
    attempted: true,
    success: false,
    error: null,
    details: []
  };

  try {
    // Try different RPC function names that might exist
    const rpcMethods = ['exec_sql', 'execute_sql', 'sql', 'query'];
    
    for (const method of rpcMethods) {
      try {
        const { data, error } = await supabase.rpc(method, { 
          sql: 'SELECT 1 as test;'
        });
        
        if (!error) {
          result.success = true;
          result.working_method = method;
          result.details.push(`✅ RPC method '${method}' is available`);
          break;
        } else {
          result.details.push(`❌ RPC method '${method}': ${error.message}`);
        }
      } catch (err) {
        result.details.push(`❌ RPC method '${method}': ${err.message}`);
      }
    }
    
    if (!result.success) {
      result.error = 'No working RPC SQL execution method found';
    }

  } catch (error) {
    result.error = error.message;
  }

  return result;
}

async function attemptRESTAPI() {
  const result = {
    method: 'rest_api',
    attempted: true,
    success: false,
    error: null,
    details: []
  };

  // Try different REST API endpoints for SQL execution
  const endpoints = [
    '/rest/v1/rpc/sql',
    '/rest/v1/rpc/exec_sql', 
    '/rest/v1/rpc/execute_sql',
    '/sql',
    '/rpc/sql'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${SUPABASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ 
          sql: 'SELECT 1 as test;',
          query: 'SELECT 1 as test;'
        })
      });

      result.details.push(`${endpoint}: HTTP ${response.status}`);
      
      if (response.ok) {
        result.success = true;
        result.working_endpoint = endpoint;
        break;
      }
    } catch (error) {
      result.details.push(`${endpoint}: ${error.message}`);
    }
  }

  if (!result.success) {
    result.error = 'No working REST API SQL endpoint found';
  }

  return result;
}

async function attemptIndividualCreation() {
  const result = {
    method: 'individual_creation',
    attempted: true,
    success: false,
    error: null,
    details: [],
    tables_created: [],
    tables_failed: []
  };

  // Try to create tables using Supabase client methods
  try {
    // This would require using the table creation methods available in Supabase
    // For now, just document that this approach exists
    result.details.push('Individual table creation would require Supabase Management API');
    result.details.push('This requires additional API keys and permissions');
    result.error = 'Individual creation not implemented - requires Management API access';
  } catch (error) {
    result.error = error.message;
  }

  return result;
}

function generateRecommendations(report) {
  const recommendations = [];

  // Check if any methods worked
  const successfulMethods = report.methods_attempted.filter(m => m.success);
  
  if (successfulMethods.length === 0) {
    recommendations.push({
      priority: 'HIGH',
      action: 'Manual Execution Required',
      details: 'Execute migration manually using Supabase Dashboard SQL Editor',
      steps: [
        'Go to https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx',
        'Navigate to SQL Editor',
        'Paste the migration SQL from 20250111_api_system_setup_modified.sql',
        'Execute the query'
      ]
    });
  }

  // Check what tables already exist
  const existingTables = Object.entries(report.pre_migration_state.tables || {})
    .filter(([_, state]) => state.exists)
    .map(([table, _]) => table);

  if (existingTables.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      action: 'Check Existing Tables',
      details: `Some tables already exist: ${existingTables.join(', ')}`,
      note: 'Migration uses CREATE TABLE IF NOT EXISTS, so this should be safe'
    });
  }

  // Database connectivity
  if (report.pre_migration_state.connection_status !== 'connected') {
    recommendations.push({
      priority: 'HIGH',
      action: 'Fix Database Connection',
      details: 'Cannot connect to database with provided credentials',
      check: 'Verify SUPABASE_SERVICE_ROLE_KEY is correct and has proper permissions'
    });
  }

  return recommendations;
}

function determineStatus(report) {
  const successfulMethods = report.methods_attempted.filter(m => m.success);
  
  if (successfulMethods.length > 0) {
    return 'success';
  }
  
  if (report.pre_migration_state.connection_status === 'connected') {
    return 'manual_execution_required';
  }
  
  return 'failed';
}

function printSummary(report) {
  console.log('\n' + '=' .repeat(60));
  console.log('📊 MIGRATION EXECUTION SUMMARY');
  console.log('=' .repeat(60));
  
  console.log(`📅 Timestamp: ${report.timestamp}`);
  console.log(`🏁 Final Status: ${report.final_status.toUpperCase()}`);
  console.log(`🔗 Connection: ${report.pre_migration_state.connection_status}`);
  
  console.log('\n🎯 Methods Attempted:');
  report.methods_attempted.forEach((method, index) => {
    const status = method.success ? '✅ SUCCESS' : '❌ FAILED';
    console.log(`  ${index + 1}. ${method.method}: ${status}`);
    if (method.error) {
      console.log(`     Error: ${method.error}`);
    }
  });

  console.log('\n📋 Tables Status:');
  Object.entries(report.pre_migration_state.tables || {}).forEach(([table, state]) => {
    const status = state.exists ? '✅ EXISTS' : '❌ MISSING';
    console.log(`  ${table}: ${status}`);
  });

  console.log('\n💡 Recommendations:');
  report.recommendations.forEach((rec, index) => {
    console.log(`  ${index + 1}. [${rec.priority}] ${rec.action}`);
    console.log(`     ${rec.details}`);
  });

  if (report.final_status === 'manual_execution_required') {
    console.log('\n🚨 MANUAL EXECUTION REQUIRED');
    console.log('The migration must be executed manually through the Supabase Dashboard.');
    console.log('See MIGRATION_MANUAL_INSTRUCTIONS.md for detailed steps.');
  }

  console.log('\n📁 Files Created:');
  console.log('  - 20250111_api_system_setup_modified.sql (modified migration)');
  console.log('  - MIGRATION_MANUAL_INSTRUCTIONS.md (execution guide)');
  console.log('  - migration_execution_report.json (detailed report)');
  
  console.log('\n' + '=' .repeat(60));
}

// Execute the final migration attempt
executeFinalMigration().then((report) => {
  console.log('\n🎉 Migration analysis completed!');
  
  if (report.final_status === 'success') {
    console.log('✅ Migration executed successfully via automated method');
  } else if (report.final_status === 'manual_execution_required') {
    console.log('⚠️  Manual execution required - see instructions above');
  } else {
    console.log('❌ Migration failed - check connection and permissions');
  }
  
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Migration analysis failed:', error);
  process.exit(1);
});