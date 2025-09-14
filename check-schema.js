#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTable(tableName) {
  try {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);

    if (error && error.code === 'PGRST116') {
      return false; // Table doesn't exist
    } else if (error) {
      console.error(`Error checking ${tableName}:`, error);
      return false;
    } else {
      return true; // Table exists
    }
  } catch (err) {
    console.error(`Exception checking ${tableName}:`, err.message);
    return false;
  }
}

async function checkSchema() {
  console.log('🔍 Checking multi-tenant schema...\n');

  const requiredTables = [
    'companies',
    'team_users',
    'user_invitations',
    'company_settings'
  ];

  for (const table of requiredTables) {
    const exists = await checkTable(table);
    console.log(`${exists ? '✅' : '❌'} ${table}: ${exists ? 'EXISTS' : 'MISSING'}`);
  }

  // Check if team_users has company_id column
  try {
    const { data, error } = await supabase.from('team_users').select('company_id').limit(1);
    console.log(`${error ? '❌' : '✅'} team_users.company_id: ${error ? 'MISSING' : 'EXISTS'}`);
  } catch (err) {
    console.log(`❌ team_users.company_id: ERROR`);
  }

  console.log('\n🎯 Now testing company registration...');
}

checkSchema();