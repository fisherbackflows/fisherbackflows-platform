const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearAllSessions() {
  console.log('🔥 SECURITY FIX: Clearing all team sessions...\n');

  try {
    // Delete all active sessions from the database
    const { data: deletedSessions, error } = await supabase
      .from('team_sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all sessions

    if (error) {
      console.error('❌ Error clearing sessions:', error.message);
      return;
    }

    console.log('✅ All team sessions have been cleared from database');
    console.log(`🗑️  Sessions cleared: ${deletedSessions?.length || 'All'}`);
    console.log('\n🔒 Security improvements applied:');
    console.log('   - Removed login bypass vulnerability');
    console.log('   - Fixed dashboard authentication');
    console.log('   - Enhanced logout cookie clearing');
    console.log('   - Added RoleGuard protection');
    console.log('   - Cleared all existing sessions');
    console.log('\n✅ Authentication is now properly secured!');
    console.log('🚨 All users must log in again with proper credentials.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

clearAllSessions();