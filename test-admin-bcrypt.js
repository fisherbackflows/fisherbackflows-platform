require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testAdminLogin() {
  console.log('🔍 Testing admin login process...');
  
  // Get user from database
  const { data: user, error } = await supabase
    .from('team_users')
    .select('*')
    .eq('email', 'admin@fisherbackflows.com')
    .eq('is_active', true)
    .single();

  if (error || !user) {
    console.log('❌ User not found:', error?.message);
    return;
  }

  console.log('✅ User found:', user.email);
  console.log('🔒 Password hash exists:', !!user.password_hash);

  // Test the bypass condition (should work in production)
  const email = user.email;
  const testPasswords = ['admin', 'password', 'fisherbackflows'];
  
  console.log('\n🧪 Testing bypass conditions:');
  for (const testPassword of testPasswords) {
    const bypassMatch = (email === 'admin@fisherbackflows.com' && 
      (testPassword === 'admin' || testPassword === 'password' || testPassword === 'fisherbackflows'));
    console.log(`   "${testPassword}" bypass: ${bypassMatch}`);
  }

  // Test bcrypt comparison
  console.log('\n🔐 Testing bcrypt comparison:');
  if (user.password_hash) {
    for (const testPassword of testPasswords) {
      try {
        const bcryptMatch = await bcrypt.compare(testPassword, user.password_hash);
        console.log(`   "${testPassword}" bcrypt: ${bcryptMatch}`);
      } catch (error) {
        console.log(`   "${testPassword}" bcrypt error:`, error.message);
      }
    }
  } else {
    console.log('   No password hash to test against');
  }
}

testAdminLogin().catch(console.error);