require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🔍 Checking admin user password_hash...');
supabase
  .from('team_users')
  .select('email, password_hash, is_active')
  .eq('email', 'admin@fisherbackflows.com')
  .single()
  .then(({ data, error }) => {
    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('📧 Email:', data?.email);
      console.log('🔒 Has password_hash:', !!data?.password_hash);
      console.log('📏 Password hash length:', data?.password_hash?.length || 0);
      console.log('✅ Is active:', data?.is_active);
      if (data?.password_hash) {
        console.log('🔑 Password hash starts with:', data.password_hash.substring(0, 10) + '...');
      } else {
        console.log('⚠️  No password_hash found! This is the problem.');
        console.log('💡 Need to create password hash for admin user');
      }
    }
  });