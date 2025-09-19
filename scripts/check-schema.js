#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCurrentSchema() {
  console.log('🔍 Checking current database schema...\n');

  try {
    // Check existing tables
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names');

    if (tablesError) {
      // Fallback - check some known tables
      const knownTables = ['companies', 'team_users', 'customers', 'devices', 'appointments'];

      console.log('📋 Checking known tables:');
      for (const tableName of knownTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

          if (error) {
            console.log(`   ❌ ${tableName}: ${error.message}`);
          } else {
            console.log(`   ✅ ${tableName}: Exists`);
          }
        } catch (err) {
          console.log(`   ❌ ${tableName}: ${err.message}`);
        }
      }
    } else {
      console.log('📋 Found tables:', tables);
    }

    // Check if companies table exists and what columns it has
    console.log('\n🏢 Checking companies table structure...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);

    if (companiesError) {
      console.log(`❌ Companies table: ${companiesError.message}`);

      // Try to create companies table manually
      console.log('\n🔨 Creating companies table...');
      const createCompaniesSQL = `
        CREATE TABLE IF NOT EXISTS companies (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(100) UNIQUE NOT NULL,
          email VARCHAR(255) NOT NULL,
          business_type VARCHAR(100),
          plan_type VARCHAR(50) DEFAULT 'starter',
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      // Since we can't execute DDL through supabase client easily,
      // let's just verify what we can work with
      console.log('⚠️  Need to create companies table through Supabase dashboard');

    } else {
      console.log('✅ Companies table exists and is accessible');
      console.log('📊 Sample company data structure:', companies[0] || 'No data');
    }

    // Check team_users to see if it has company_id
    console.log('\n👥 Checking team_users table...');
    const { data: users, error: usersError } = await supabase
      .from('team_users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.log(`❌ team_users: ${usersError.message}`);
    } else {
      console.log('✅ team_users table exists');
      if (users.length > 0) {
        const userColumns = Object.keys(users[0]);
        console.log('📊 Current columns:', userColumns);
        console.log('🔍 Has company_id:', userColumns.includes('company_id'));
      }
    }

  } catch (error) {
    console.error('💥 Error checking schema:', error);
  }
}

checkCurrentSchema();