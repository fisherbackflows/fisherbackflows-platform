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

async function describeCompaniesTable() {
  console.log('🔍 Checking what columns exist in companies table...\n');

  // Try selecting all columns to see what exists
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .limit(0); // Get structure only

    if (error) {
      console.error('❌ Select * error:', error);

      // Try basic ID column
      const { data: idData, error: idError } = await supabase
        .from('companies')
        .select('id')
        .limit(1);

      if (idError) {
        console.error('❌ Even ID column fails:', idError);
      } else {
        console.log('✅ Companies table exists but with minimal/different structure');
        console.log('✅ ID column works');
      }
    } else {
      console.log('✅ Companies table structure:', data);
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  // Let's try to see what columns are available by trying common ones
  const commonColumns = ['id', 'name', 'created_at', 'updated_at'];

  console.log('\n🧪 Testing common columns:');
  for (const col of commonColumns) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(col)
        .limit(1);

      console.log(`${error ? '❌' : '✅'} ${col}: ${error ? error.message : 'EXISTS'}`);
    } catch (err) {
      console.log(`❌ ${col}: EXCEPTION - ${err.message}`);
    }
  }
}

describeCompaniesTable();