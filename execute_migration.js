const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://jvhbqfueutvfepsjmztx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function executeMigration() {
  console.log('🚀 Starting API System Setup Migration...');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250111_api_system_setup_modified.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📖 Read migration file successfully');
    console.log(`Migration size: ${migrationSQL.length} characters`);
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comments and empty statements
      if (statement.trim().startsWith('--') || statement.trim().length <= 1) {
        continue;
      }
      
      console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`);
      console.log(`Preview: ${statement.substring(0, 100)}...`);
      
      try {
        // Use the REST API to execute SQL
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ sql: statement })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        
        const result = await response.json();
        console.log('✅ Statement executed successfully');
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        errors.push({
          statement: i + 1,
          sql: statement.substring(0, 200),
          error: error.message
        });
        errorCount++;
        
        // For critical errors, we might want to stop
        if (error.message.includes('syntax error') || error.message.includes('does not exist')) {
          console.log('⚠️  Critical error detected, continuing with next statement...');
        }
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 Migration Execution Summary:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    console.log(`📈 Success rate: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. Statement ${error.statement}: ${error.error}`);
        console.log(`   SQL: ${error.sql}...`);
      });
    }
    
    // Verify that key tables were created
    console.log('\n🔍 Verifying migration results...');
    await verifyMigration();
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
  }
}

async function verifyMigration() {
  const tablesToCheck = ['companies', 'api_keys', 'api_usage_logs', 'webhook_endpoints', 'webhook_deliveries', 'api_rate_limits'];
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase.from(table).select('count').limit(1);
      
      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table}: Created successfully`);
      }
    } catch (error) {
      console.log(`❌ Table ${table}: ${error.message}`);
    }
  }
  
  // Check if functions were created
  try {
    const { data, error } = await supabase.rpc('get_current_company_id');
    if (error) {
      console.log(`❌ Function get_current_company_id: ${error.message}`);
    } else {
      console.log(`✅ Function get_current_company_id: Working, returned ${data}`);
    }
  } catch (error) {
    console.log(`❌ Function get_current_company_id: ${error.message}`);
  }
}

// Execute the migration
executeMigration().then(() => {
  console.log('\n🎉 Migration process completed!');
}).catch(error => {
  console.error('\n💥 Migration process failed:', error);
});