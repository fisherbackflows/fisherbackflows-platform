const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://jvhbqfueutvfepsjmztx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY';

async function executeSQL(sql) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
}

async function executeMigrationDirect() {
  console.log('🚀 Starting API System Setup Migration (Direct Method)...');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250111_api_system_setup_modified.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📖 Read migration file successfully');
    console.log(`Migration size: ${migrationSQL.length} characters`);
    
    // Try to execute the entire migration at once
    console.log('🔄 Executing migration...');
    
    try {
      const result = await executeSQL(migrationSQL);
      console.log('✅ Migration executed successfully!');
      console.log('Result:', result);
      
      // Verify the migration
      await verifyMigration();
      
    } catch (error) {
      console.error('❌ Direct execution failed:', error.message);
      
      // If direct execution fails, try statement by statement
      console.log('🔄 Falling back to statement-by-statement execution...');
      await executeStatementsIndividually(migrationSQL);
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
  }
}

async function executeStatementsIndividually(migrationSQL) {
  // Split the migration into individual statements
  const statements = migrationSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt !== '');
  
  console.log(`📝 Found ${statements.length} SQL statements to execute`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim() + ';';
    
    // Skip empty statements and comments
    if (statement.length <= 2 || statement.startsWith('--')) {
      continue;
    }
    
    console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`);
    
    // Show first part of statement for identification
    const preview = statement.substring(0, 100).replace(/\s+/g, ' ');
    console.log(`Preview: ${preview}...`);
    
    try {
      const result = await executeSQL(statement);
      console.log('✅ Statement executed successfully');
      successCount++;
      
    } catch (error) {
      console.error(`❌ Error executing statement ${i + 1}:`, error.message);
      errors.push({
        statement: i + 1,
        sql: preview,
        error: error.message
      });
      errorCount++;
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n📊 Migration Execution Summary:');
  console.log(`✅ Successful statements: ${successCount}`);
  console.log(`❌ Failed statements: ${errorCount}`);
  
  if (successCount + errorCount > 0) {
    console.log(`📈 Success rate: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`);
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    errors.forEach((error, index) => {
      console.log(`${index + 1}. Statement ${error.statement}: ${error.error}`);
      console.log(`   SQL: ${error.sql}...`);
    });
  }
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration results...');
  
  const tablesToCheck = ['companies', 'api_keys', 'api_usage_logs', 'webhook_endpoints', 'webhook_deliveries', 'api_rate_limits'];
  
  for (const table of tablesToCheck) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        }
      });
      
      if (response.ok) {
        console.log(`✅ Table ${table}: Created successfully`);
      } else {
        const errorText = await response.text();
        console.log(`❌ Table ${table}: ${errorText}`);
      }
      
    } catch (error) {
      console.log(`❌ Table ${table}: ${error.message}`);
    }
  }
  
  // Test the get_current_company_id function
  try {
    const result = await executeSQL('SELECT get_current_company_id() as company_id;');
    console.log(`✅ Function get_current_company_id: Working, returned ${result[0]?.company_id}`);
  } catch (error) {
    console.log(`❌ Function get_current_company_id: ${error.message}`);
  }
  
  // Test the generate_api_key function
  try {
    const result = await executeSQL('SELECT generate_api_key() as api_key;');
    console.log(`✅ Function generate_api_key: Working, generated key starting with ${result[0]?.api_key?.substring(0, 10)}...`);
  } catch (error) {
    console.log(`❌ Function generate_api_key: ${error.message}`);
  }
}

// Execute the migration
executeMigrationDirect().then(() => {
  console.log('\n🎉 Migration process completed!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Migration process failed:', error);
  process.exit(1);
});