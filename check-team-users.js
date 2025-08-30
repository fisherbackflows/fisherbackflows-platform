const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkTeamUsers() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('👥 Checking team_users table...');

  try {
    const { data: users, error } = await supabase
      .from('team_users')
      .select('*');
    
    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log(`✅ Found ${users?.length || 0} team users`);
      
      if (users && users.length > 0) {
        console.log('\n📋 Team users:');
        users.forEach((user, i) => {
          console.log(`   ${i+1}. ${user.first_name} ${user.last_name} (${user.email}) - Role: ${user.role}`);
          console.log(`      ID: ${user.id}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTeamUsers();