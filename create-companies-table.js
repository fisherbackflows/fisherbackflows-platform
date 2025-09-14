#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
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

async function createCompaniesTable() {
  console.log('🏢 Creating companies table...');

  const sql = `
    CREATE TABLE IF NOT EXISTS companies (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      subdomain VARCHAR(50) UNIQUE,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      website VARCHAR(255),
      address_line1 VARCHAR(255),
      address_line2 VARCHAR(255),
      city VARCHAR(100),
      state VARCHAR(50),
      zip_code VARCHAR(20),
      country VARCHAR(50) DEFAULT 'US',
      business_type VARCHAR(100),
      license_number VARCHAR(100),
      certification_level VARCHAR(50),
      plan_type VARCHAR(50) DEFAULT 'starter',
      max_users INTEGER DEFAULT 5,
      features JSONB DEFAULT '{"reports": true, "scheduling": true, "billing": false}',
      status VARCHAR(20) DEFAULT 'active',
      trial_ends_at TIMESTAMP WITH TIME ZONE,
      subscription_id VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT companies_name_check CHECK (LENGTH(name) >= 2),
      CONSTRAINT companies_slug_check CHECK (slug ~ '^[a-z0-9-]+$'),
      CONSTRAINT companies_subdomain_check CHECK (subdomain IS NULL OR subdomain ~ '^[a-z0-9-]+$')
    );
  `;

  try {
    const { data, error } = await supabase.from('companies').select('id').limit(1);

    if (error && error.code === 'PGRST116') {
      // Table doesn't exist, create it
      console.log('Table does not exist, need to create it via SQL editor...');
      console.log('SQL to execute:');
      console.log(sql);
      return false;
    } else if (error) {
      console.error('Error checking table:', error);
      return false;
    } else {
      console.log('✅ Companies table already exists!');
      return true;
    }
  } catch (err) {
    console.error('Exception:', err.message);
    return false;
  }
}

async function checkAndCreateTable() {
  const exists = await createCompaniesTable();

  if (!exists) {
    console.log('\n🔧 Manual steps required:');
    console.log('1. Go to: https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx/sql');
    console.log('2. Copy the SQL above');
    console.log('3. Execute it in the SQL editor');
    console.log('4. Re-run this script to continue');
    process.exit(1);
  }

  console.log('✅ Database is ready for multi-tenant system!');
}

checkAndCreateTable();