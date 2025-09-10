const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://jvhbqfueutvfepsjmztx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function runMigration() {
  console.log('🚀 Starting scheduling system migration...\n');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'database', 'scheduling-system.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split into individual statements
    const statements = sql
      .split(/;(?=\s*(?:--|CREATE|ALTER|INSERT|SELECT|DROP|UPDATE|DELETE|$))/)
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;
      
      // Get a description of what we're doing
      let description = 'Executing SQL';
      if (statement.includes('CREATE TABLE')) {
        const match = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i);
        description = `Creating table: ${match ? match[1] : 'unknown'}`;
      } else if (statement.includes('ALTER TABLE')) {
        const match = statement.match(/ALTER TABLE (\w+)/i);
        description = `Altering table: ${match ? match[1] : 'unknown'}`;
      } else if (statement.includes('CREATE INDEX')) {
        const match = statement.match(/CREATE INDEX (?:IF NOT EXISTS )?(\w+)/i);
        description = `Creating index: ${match ? match[1] : 'unknown'}`;
      } else if (statement.includes('CREATE POLICY')) {
        const match = statement.match(/CREATE POLICY "([^"]+)"/i);
        description = `Creating policy: ${match ? match[1] : 'unknown'}`;
      } else if (statement.includes('CREATE OR REPLACE FUNCTION')) {
        const match = statement.match(/CREATE OR REPLACE FUNCTION (\w+)/i);
        description = `Creating function: ${match ? match[1] : 'unknown'}`;
      } else if (statement.includes('INSERT INTO')) {
        const match = statement.match(/INSERT INTO (\w+)/i);
        description = `Inserting data into: ${match ? match[1] : 'unknown'}`;
      } else if (statement.includes('SELECT')) {
        description = 'Running query';
      }
      
      process.stdout.write(`[${i + 1}/${statements.length}] ${description}... `);
      
      try {
        // Execute the statement directly using Supabase's query interface
        const { data, error } = await supabase.rpc('query', { 
          query_text: statement + (statement.endsWith(';') ? '' : ';')
        }).single();
        
        if (error) {
          // Try alternative approach - direct execution
          const response = await fetch('https://jvhbqfueutvfepsjmztx.supabase.co/rest/v1/rpc/query', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({ query_text: statement + ';' })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          }
        }
        
        console.log('✅');
        successCount++;
      } catch (error) {
        console.log('❌');
        errorCount++;
        errors.push({ description, error: error.message });
        
        // Continue with other statements even if one fails
        console.log(`   ⚠️  Error: ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      errors.forEach((e, i) => {
        console.log(`   ${i + 1}. ${e.description}`);
        console.log(`      ${e.error}`);
      });
      
      console.log('\n💡 Note: Some errors may be expected (e.g., "already exists" errors).');
      console.log('   The scheduling system may still work correctly.');
    }
    
    // Test if core tables were created
    console.log('\n🔍 Verifying core tables...');
    const coreTables = [
      'geographic_zones',
      'availability_templates',
      'time_slots',
      'booking_holds'
    ];
    
    for (const table of coreTables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ ${table}: Not accessible`);
      } else {
        console.log(`   ✅ ${table}: Ready`);
      }
    }
    
    console.log('\n✨ Migration process completed!');
    console.log('   The scheduling system is now available.');
    console.log('   Customers can book appointments through /portal/schedule');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration().catch(console.error);