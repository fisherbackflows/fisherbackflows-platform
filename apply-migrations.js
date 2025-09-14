#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applySqlFile(filePath) {
  console.log(`📄 Applying ${path.basename(filePath)}...`);

  const sql = fs.readFileSync(filePath, 'utf8');

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error(`❌ Error applying ${path.basename(filePath)}:`, error);
      return false;
    }

    console.log(`✅ Successfully applied ${path.basename(filePath)}`);
    return true;
  } catch (err) {
    console.error(`❌ Exception applying ${path.basename(filePath)}:`, err.message);
    return false;
  }
}

async function applyMigrations() {
  console.log('🚀 Applying Multi-Tenant Database Migrations...\n');

  // Apply the main schema
  const schemaPath = path.join(__dirname, 'sql', 'multi-tenant-schema.sql');

  if (!fs.existsSync(schemaPath)) {
    console.error('❌ multi-tenant-schema.sql not found');
    process.exit(1);
  }

  const success = await applySqlFile(schemaPath);

  if (success) {
    console.log('\n🎉 Multi-tenant database setup complete!');
    console.log('\nNext steps:');
    console.log('1. Test company registration');
    console.log('2. Test employee management');
    console.log('3. Verify RLS policies are working');
  } else {
    console.log('\n❌ Migration failed. Please check errors above.');
    process.exit(1);
  }
}

applyMigrations();