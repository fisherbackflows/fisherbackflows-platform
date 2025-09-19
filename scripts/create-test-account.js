#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestAccount() {
  console.log('🔧 Creating test account for Fisher Backflows Team Portal...\n');

  const testAccount = {
    email: 'test@fisherbackflows.com',
    password: 'TestUser2025!',
    role: 'tester',
    first_name: 'Test',
    last_name: 'User'
  };

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(testAccount.password, 10);

    // Insert or update the test account
    const { data, error } = await supabase
      .from('team_users')
      .upsert({
        email: testAccount.email,
        password_hash: hashedPassword,
        role: testAccount.role,
        first_name: testAccount.first_name,
        last_name: testAccount.last_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating test account:', error);
      return;
    }

    console.log('✅ Test account created successfully!\n');
    console.log('=================================');
    console.log('🔐 TEST ACCOUNT CREDENTIALS');
    console.log('=================================');
    console.log(`📧 Email: ${testAccount.email}`);
    console.log(`🔑 Password: ${testAccount.password}`);
    console.log(`👤 Role: ${testAccount.role}`);
    console.log(`📝 Name: ${testAccount.first_name} ${testAccount.last_name}`);
    console.log('=================================\n');
    console.log('You can now log in at:');
    console.log('🌐 http://localhost:3010/team-portal/login');
    console.log('🌐 https://fisherbackflows.com/team-portal/login');
    console.log('\n📌 This account has access to:');
    console.log('   - Dashboard');
    console.log('   - Test Reports');
    console.log('   - Settings');
    console.log('   - All tester portal features');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createTestAccount();