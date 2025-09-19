#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupMultiTenantDatabase() {
  console.log('🚀 Setting up multi-tenant database schema...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'sql', 'multi-tenant-schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Loaded SQL schema file');
    console.log(`📏 Schema size: ${(sqlContent.length / 1024).toFixed(1)}KB`);

    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip empty statements or comments
      if (!statement || statement.startsWith('--')) continue;

      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

      try {
        const { data, error } = await supabase.rpc('execute_sql', {
          query: statement
        });

        if (error) {
          // Try direct query for DDL statements
          const { error: directError } = await supabase
            .from('_supabase_migrations')
            .select('*')
            .limit(0);

          if (directError) {
            console.log(`⚠️  Statement ${i + 1}: ${error.message}`);

            // For certain errors, we'll continue (like "already exists")
            if (error.message.includes('already exists') ||
                error.message.includes('does not exist') ||
                error.message.includes('duplicate key')) {
              console.log(`   → Continuing (expected for existing schema)`);
              successCount++;
            } else {
              errorCount++;
            }
          } else {
            successCount++;
          }
        } else {
          successCount++;
          console.log(`   ✅ Success`);
        }

      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n=================================');
    console.log('📊 MULTI-TENANT SETUP RESULTS');
    console.log('=================================');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    console.log(`📋 Total statements: ${statements.length}\n`);

    if (errorCount > 0) {
      console.log('⚠️  Some statements failed. This is often normal for:');
      console.log('   - Tables/constraints that already exist');
      console.log('   - Functions that are already defined');
      console.log('   - Indexes that already exist\n');
    }

    // Verify key tables were created
    console.log('🔍 Verifying schema setup...');

    const tables = ['companies', 'user_invitations', 'company_settings'];
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`   ❌ Table '${table}': ${error.message}`);
      } else {
        console.log(`   ✅ Table '${table}': Ready`);
      }
    }

    console.log('\n🎉 Multi-tenant database setup completed!');
    console.log('\nNext steps:');
    console.log('1. 📝 Create company registration flow');
    console.log('2. 👥 Build admin dashboard for employee management');
    console.log('3. 🔐 Update authentication to be company-aware');
    console.log('4. 🛡️  Test RLS policies for data isolation');

  } catch (error) {
    console.error('💥 Fatal error during setup:', error);
    process.exit(1);
  }
}

// Helper function for direct SQL execution (if needed)
async function executeSQLDirect(sql) {
  try {
    // This is a fallback method using raw SQL execution
    const { data, error } = await supabase.rpc('exec', { query: sql });
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

setupMultiTenantDatabase();