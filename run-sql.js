#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runSql() {
  console.log('Creating email_verifications table...\n');
  
  const sqlContent = fs.readFileSync('create-email-verifications-table.sql', 'utf8');
  
  // Split SQL into individual statements
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    
    const { error } = await supabase.rpc('exec_sql', { sql: statement }).single();
    
    if (error) {
      console.error(`Error in statement ${i + 1}:`, error);
    } else {
      console.log(`✅ Statement ${i + 1} executed successfully`);
    }
  }
  
  console.log('\n✅ Database setup complete!');
  console.log('\nNow you can use the Resend-only registration endpoint:');
  console.log('POST /api/auth/register-resend-only');
}

runSql().catch(console.error);