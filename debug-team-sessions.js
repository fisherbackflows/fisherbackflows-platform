const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugTeamSessions() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔍 Debugging team_sessions table...');

  try {
    // Check if team_sessions table exists
    const { data, error } = await supabase
      .from('team_sessions')
      .select('*')
      .limit(1);
      
    if (error) {
      console.log('❌ Error accessing team_sessions:', error.message);
      console.log('Full error:', error);
      
      // Try to create the table
      console.log('🔧 Attempting to create team_sessions table...');
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.team_sessions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          team_user_id UUID REFERENCES public.team_users(id) ON DELETE CASCADE,
          session_token TEXT UNIQUE NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        ALTER TABLE public.team_sessions ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "service_role_access" ON public.team_sessions 
          FOR ALL 
          USING (current_setting('request.jwt.claim.role', true) = 'service_role');
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      if (createError) {
        console.log('❌ Error creating table:', createError);
      } else {
        console.log('✅ team_sessions table created');
      }
    } else {
      console.log(`✅ team_sessions table exists with ${data?.length || 0} records`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugTeamSessions();