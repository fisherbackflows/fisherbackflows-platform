const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkSessionsInDB() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔍 Checking team_sessions in database...');

  try {
    const { data: sessions, error } = await supabase
      .from('team_sessions')
      .select(`
        *,
        team_users(email, role, first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('❌ Error querying sessions:', error.message);
    } else {
      console.log(`✅ Found ${sessions?.length || 0} sessions in database`);
      
      if (sessions && sessions.length > 0) {
        console.log('\n📋 Recent sessions:');
        sessions.slice(0, 3).forEach((session, i) => {
          console.log(`${i+1}. Token: ${session.session_token?.substring(0, 8)}...`);
          console.log(`   User: ${session.team_users?.email}`);
          console.log(`   Role: ${session.team_users?.role}`);
          console.log(`   Expires: ${session.expires_at}`);
          console.log(`   Created: ${session.created_at}`);
          
          // Check if expired
          const isExpired = new Date(session.expires_at) < new Date();
          console.log(`   Status: ${isExpired ? 'EXPIRED' : 'VALID'}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkSessionsInDB();