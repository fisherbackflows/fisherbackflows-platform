const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugAuth() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔍 Debugging authentication...');

  try {
    // Check if team_users table exists and has data
    const { data: users, error } = await supabase
      .from('team_users')
      .select('*')
      .limit(5);
      
    if (error) {
      console.log('❌ Error querying team_users:', error.message);
    } else {
      console.log(`✅ Found ${users?.length || 0} team users`);
      if (users && users.length > 0) {
        console.log('Sample user:', users[0]);
      }
    }

    // Check admin user specifically
    const { data: adminUser, error: adminError } = await supabase
      .from('team_users')
      .select('*')
      .eq('email', 'admin@fisherbackflows.com');
      
    if (adminError) {
      console.log('❌ Error finding admin user:', adminError.message);
    } else {
      console.log(`Admin user found: ${adminUser && adminUser.length > 0 ? 'Yes' : 'No'}`);
      if (adminUser && adminUser.length > 0) {
        console.log('Admin user details:', adminUser[0]);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugAuth();