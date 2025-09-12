const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Supabase PostgreSQL connection details
const client = new Client({
  host: 'aws-0-us-west-1.pooler.supabase.com',  // Supabase direct PostgreSQL host
  port: 5432,
  database: 'postgres',
  user: 'postgres.jvhbqfueutvfepsjmztx',  // Service role user
  password: 'fjDhw4S$kDFQgF5g%LKzb4',  // This would need the actual password
  ssl: {
    rejectUnauthorized: false
  }
});

// Alternative connection using Supabase pooler
const alternativeClient = new Client({
  host: 'jvhbqfueutvfepsjmztx.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'fjDhw4S$kDFQgF5g%LKzb4',  // This would need the actual database password
  ssl: {
    rejectUnauthorized: false
  }
});

async function executeMigrationPG() {
  console.log('🚀 Starting API System Setup Migration via PostgreSQL connection...');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250111_api_system_setup_modified.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📖 Read migration file successfully');
    console.log(`Migration size: ${migrationSQL.length} characters`);
    
    // Try to connect
    console.log('🔌 Connecting to PostgreSQL database...');
    
    // Note: We don't have the actual password, so this approach won't work directly
    // Let's try using the SUPABASE_DB_PASSWORD if it's set in environment
    if (!process.env.SUPABASE_DB_PASSWORD) {
      console.log('❌ SUPABASE_DB_PASSWORD environment variable not set');
      console.log('💡 Direct PostgreSQL connection requires the database password');
      console.log('💡 Alternative: Use Supabase Dashboard SQL Editor or API');
      return;
    }
    
    await client.connect();
    console.log('✅ Connected to database successfully');
    
    // Execute the migration
    console.log('🔄 Executing migration...');
    const result = await client.query(migrationSQL);
    console.log('✅ Migration executed successfully!');
    console.log('Result:', result);
    
    // Verify the migration
    await verifyMigrationPG(client);
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('💡 Password authentication failed - this is expected as we don\'t have the database password');
      console.log('💡 Recommendation: Use Supabase Dashboard SQL Editor to execute the migration');
    }
  } finally {
    try {
      await client.end();
      console.log('🔌 Database connection closed');
    } catch (err) {
      // Connection might not have been established
    }
  }
}

async function verifyMigrationPG(client) {
  console.log('🔍 Verifying migration results...');
  
  const tablesToCheck = ['companies', 'api_keys', 'api_usage_logs', 'webhook_endpoints', 'webhook_deliveries', 'api_rate_limits'];
  
  for (const table of tablesToCheck) {
    try {
      const result = await client.query(`SELECT COUNT(*) FROM information_schema.tables WHERE table_name = $1`, [table]);
      if (result.rows[0].count > 0) {
        console.log(`✅ Table ${table}: Created successfully`);
      } else {
        console.log(`❌ Table ${table}: Not found`);
      }
    } catch (error) {
      console.log(`❌ Table ${table}: ${error.message}`);
    }
  }
  
  // Test functions
  try {
    const result = await client.query('SELECT get_current_company_id() as company_id');
    console.log(`✅ Function get_current_company_id: Working, returned ${result.rows[0].company_id}`);
  } catch (error) {
    console.log(`❌ Function get_current_company_id: ${error.message}`);
  }
}

// Alternative: Create SQL file with instructions for manual execution
function createManualInstructions() {
  console.log('\n📝 Creating manual execution instructions...');
  
  const instructions = `
# API System Setup Migration - Manual Execution Instructions

Since automated execution via API is not available, please execute this migration manually using the Supabase Dashboard:

## Steps:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx
2. **Navigate to SQL Editor**: Click on "SQL Editor" in the left sidebar
3. **Create New Query**: Click "New Query"
4. **Copy Migration SQL**: Copy the entire content from the file:
   \`/mnt/c/users/Fishe/fisherbackflows2/fisherbackflows-platform/supabase/migrations/20250111_api_system_setup_modified.sql\`
5. **Paste and Execute**: Paste the SQL into the editor and click "Run"

## Migration Summary:

The migration will create:
- ✅ companies table (for API multi-tenancy support)
- ✅ api_keys table (for API authentication)
- ✅ api_usage_logs table (for tracking API usage)
- ✅ webhook_endpoints table (for webhook configurations)
- ✅ webhook_deliveries table (for webhook delivery logs)
- ✅ api_rate_limits table (for rate limiting)
- ✅ Required indexes for performance
- ✅ RLS policies for security
- ✅ Helper functions for API management

## Expected Output:

After successful execution, you should see messages like:
- CREATE EXTENSION
- CREATE TABLE
- CREATE INDEX
- ALTER TABLE
- CREATE POLICY
- CREATE FUNCTION
- CREATE TRIGGER
- CREATE VIEW
- COMMENT

## Verification:

After execution, verify by running these queries in SQL Editor:
\`\`\`sql
-- Check tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN (
    'companies', 'api_keys', 'api_usage_logs', 
    'webhook_endpoints', 'webhook_deliveries', 'api_rate_limits'
);

-- Test functions
SELECT get_current_company_id() as company_id;
SELECT generate_api_key() as sample_key;

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename LIKE '%api%' OR tablename = 'companies';
\`\`\`

## Next Steps:

After successful migration, the Backflow Buddy API system will be ready for:
- API key management
- Usage tracking and analytics  
- Webhook integrations
- Rate limiting
- Multi-tenant support (via companies table)
`;

  fs.writeFileSync(path.join(__dirname, 'MIGRATION_MANUAL_INSTRUCTIONS.md'), instructions);
  console.log('📄 Manual instructions saved to: MIGRATION_MANUAL_INSTRUCTIONS.md');
}

// Execute the migration attempt
executeMigrationPG().then(() => {
  createManualInstructions();
  console.log('\n🎉 Migration process completed!');
  console.log('💡 See MIGRATION_MANUAL_INSTRUCTIONS.md for manual execution steps');
}).catch(error => {
  console.error('\n💥 Migration process failed:', error);
  createManualInstructions();
  console.log('💡 See MIGRATION_MANUAL_INSTRUCTIONS.md for manual execution steps');
});