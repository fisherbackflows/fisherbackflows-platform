const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkTeamSessionsPolicies() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔍 Checking team_sessions RLS policies...');

  try {
    // Check if we can query team_sessions at all
    const { data: sessions, error } = await supabaseAdmin
      .from('team_sessions')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Cannot query team_sessions:', error.message);
      
      // Try to check if RLS is enabled
      const { data: tableInfo, error: tableError } = await supabaseAdmin
        .from('information_schema.tables')
        .select('*')
        .eq('table_name', 'team_sessions');
        
      if (tableInfo) {
        console.log('✅ team_sessions table exists');
      }
      
      // Try to create proper RLS policy for team_sessions
      console.log('🔧 Attempting to fix team_sessions RLS...');
      const policySQL = `
        DROP POLICY IF EXISTS "service_role_access" ON public.team_sessions;
        DROP POLICY IF EXISTS "authenticated_api_access" ON public.team_sessions;
        
        CREATE POLICY "service_role_full_access" ON public.team_sessions 
          FOR ALL 
          USING (current_setting('request.jwt.claim.role', true) = 'service_role');
      `;
      
      const { error: policyError } = await supabaseAdmin.rpc('exec_sql', { 
        sql: policySQL 
      });
      
      if (policyError) {
        console.log('❌ Policy creation failed:', policyError);
      } else {
        console.log('✅ team_sessions RLS policy updated');
        
        // Test again
        const { data: retestSessions, error: retestError } = await supabaseAdmin
          .from('team_sessions')
          .select('*')
          .limit(1);
          
        if (retestError) {
          console.log('❌ Still cannot query after policy fix:', retestError.message);
        } else {
          console.log('✅ team_sessions now accessible');
        }
      }
      
    } else {
      console.log(`✅ team_sessions accessible with ${sessions?.length || 0} records`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTeamSessionsPolicies();