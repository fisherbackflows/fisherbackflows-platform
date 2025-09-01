#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runDatabaseUpdate() {
  console.log('🔄 Starting critical database update...');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'CRITICAL_DATABASE_UPDATE_2025_09_01.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Create Supabase client with service role
    const supabase = createClient(
      'https://jvhbqfueutvfepsjmztx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY'
    );

    console.log('📡 Connected to Supabase...');
    
    // Split SQL into individual statements (simple approach)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .filter(stmt => !stmt.match(/^(SELECT|UNION)/)); // Skip verification queries
    
    console.log(`📝 Found ${statements.length} SQL statements to execute...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 50)}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: statement 
        });
        
        if (error) {
          console.warn(`⚠️  Warning on statement ${i + 1}:`, error.message);
          // Don't count as error if it's just a table exists or similar
          if (!error.message.includes('already exists')) {
            errorCount++;
          }
        } else {
          successCount++;
        }
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.error(`❌ Error on statement ${i + 1}:`, err.message);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Database update completed!');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`⚠️  Errors/warnings: ${errorCount}`);
    
    // Verify key tables exist
    console.log('\n🔍 Verifying critical tables...');
    const tables = ['customers', 'devices', 'appointments', 'invoices', 'invoice_line_items', 'payments', 'team_users', 'team_sessions'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: ${count} records`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }
    
    console.log('\n🚀 Database update process complete!');
    console.log('All working APIs should now have proper database backing.');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function executeSqlDirect() {
  console.log('🔄 Trying direct SQL execution method...');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'CRITICAL_DATABASE_UPDATE_2025_09_01.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Create Supabase client
    const supabase = createClient(
      'https://jvhbqfueutvfepsjmztx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY'
    );

    // Extract just the CREATE TABLE statements first
    const createStatements = sql.match(/CREATE TABLE[^;]+;/gi) || [];
    console.log(`Found ${createStatements.length} CREATE TABLE statements`);
    
    for (const statement of createStatements) {
      try {
        console.log('Executing:', statement.substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error && !error.message.includes('already exists')) {
          console.error('Error:', error.message);
        }
      } catch (err) {
        console.warn('Warning:', err.message);
      }
    }
    
    console.log('✅ Core tables creation attempted');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the update
runDatabaseUpdate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));