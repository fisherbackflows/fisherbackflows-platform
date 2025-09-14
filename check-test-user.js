#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTestUser() {
  console.log('🔍 Checking test user data...\n');

  try {
    // Find our test admin user
    const { data: users, error: usersError } = await supabase
      .from('team_users')
      .select('id, email, first_name, last_name, role, company_id')
      .eq('email', 'apiadmin@testcompany.com');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ Test user not found');
      return;
    }

    const user = users[0];
    console.log('✅ Test user found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Company ID: ${user.company_id || 'NULL'}`);

    if (user.company_id) {
      // Get company details
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, name, slug')
        .eq('id', user.company_id)
        .single();

      if (companyError) {
        console.log(`   ⚠️ Company lookup error: ${companyError.message}`);
      } else {
        console.log(`\n🏢 Company details:`);
        console.log(`   ID: ${company.id}`);
        console.log(`   Name: ${company.name}`);
        console.log(`   Slug: ${company.slug}`);
      }

      // Check if company_settings exists
      const { data: settings, error: settingsError } = await supabase
        .from('company_settings')
        .select('id, company_id')
        .eq('company_id', user.company_id);

      if (settingsError) {
        console.log(`   ⚠️ Settings lookup error: ${settingsError.message}`);
      } else if (settings && settings.length > 0) {
        console.log(`   ✅ Company settings record exists`);
      } else {
        console.log(`   ❌ No company settings record found`);
      }
    } else {
      console.log('\n🔧 Need to update test user with company_id');

      // Find a test company to associate
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, slug')
        .ilike('name', '%test%')
        .limit(1);

      if (!companiesError && companies && companies.length > 0) {
        const testCompany = companies[0];
        console.log(`   Found test company: ${testCompany.name} (${testCompany.id})`);
        console.log(`   Run: UPDATE team_users SET company_id = '${testCompany.id}' WHERE email = 'apiadmin@testcompany.com';`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTestUser();