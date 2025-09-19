require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Generate secure API key
function generateApiKey() {
  return 'bbapi_' + crypto.randomBytes(32).toString('hex');
}

// Hash API key for storage
function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Get preview of API key (last 4 chars)
function getApiKeyPreview(key) {
  return '****' + key.slice(-4);
}

async function createFisherBackflowsAccount() {
  try {
    console.log('🏢 Creating Fisher Backflows tester portal account...');

    // First, check what tables exist
    console.log('📋 Checking current database structure...');

    const { data: existingTeamUser } = await supabase
      .from('team_users')
      .select('*')
      .eq('email', 'admin@fisherbackflows.com')
      .single();

    if (existingTeamUser) {
      console.log('❌ Team user with this email already exists:', existingTeamUser);
      return;
    }

    console.log('✅ No existing user found, proceeding with creation...');

    // Create admin user directly in team_users (simpler approach)
    const password = 'FisherAdmin123!'; // You should change this
    const hashedPassword = await bcrypt.hash(password, 12);

    const { data: teamUser, error: userError } = await supabase
      .from('team_users')
      .insert({
        email: 'admin@fisherbackflows.com',
        password_hash: hashedPassword,
        first_name: 'Fisher',
        last_name: 'Admin',
        role: 'admin',
        is_active: true,
        email_verified: true,
        phone: '(253) 278-8692'
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Error creating team user:', userError);
      return;
    }

    console.log('✅ Admin user created:', teamUser.email);

    console.log('\n🎉 Fisher Backflows team account created successfully!');
    console.log('\n📋 Account Details:');
    console.log('Email:', teamUser.email);
    console.log('Password:', password, '(CHANGE THIS!)');
    console.log('Role:', teamUser.role);
    console.log('User ID:', teamUser.id);
    console.log('\n🔗 Login at: http://localhost:3010/team-portal/login');

  } catch (error) {
    console.error('❌ Error creating account:', error);
  }
}

createFisherBackflowsAccount();