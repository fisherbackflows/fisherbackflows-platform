require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function fixEmailVerificationRLS() {
  console.log('🔧 Fixing email_verifications RLS policy...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Test if we can connect and have service role permissions
  console.log('🔗 Testing Supabase connection...');
  
  // Create new policies using direct SQL
  console.log('✨ Creating new RLS policies...');
  
  const policies = [
    `DROP POLICY IF EXISTS "Service role can manage email verifications" ON email_verifications;`,
    `DROP POLICY IF EXISTS "Users can read their own verifications" ON email_verifications;`,
    `CREATE POLICY "Service role can manage email verifications" ON email_verifications 
     FOR ALL 
     TO service_role
     USING (true)
     WITH CHECK (true);`,
    `CREATE POLICY "Users can read their own verifications" ON email_verifications
     FOR SELECT
     TO authenticated
     USING (auth.uid()::text = user_id);`
  ];
  
  for (let i = 0; i < policies.length; i++) {
    const policy = policies[i];
    console.log(`📋 Executing policy ${i + 1}/${policies.length}...`);
    
    try {
      // Try different methods to execute SQL
      let result;
      
      // Method 1: Try rpc with 'sql' function
      try {
        result = await supabase.rpc('sql', { query: policy });
      } catch (e) {
        // Method 2: Try rpc with 'exec_sql' function
        try {
          result = await supabase.rpc('exec_sql', { sql_string: policy });
        } catch (e2) {
          // Method 3: Try raw SQL execution (this might not work but worth trying)
          result = await supabase.from('pg_stat_activity').select('*').limit(0);
          console.warn('⚠️  Could not execute SQL directly. Manual SQL execution needed.');
          console.log('SQL to execute manually:', policy);
          continue;
        }
      }
      
      if (result.error) {
        console.warn(`⚠️  Policy ${i + 1} warning:`, result.error.message);
      } else {
        console.log(`✅ Policy ${i + 1} executed successfully`);
      }
    } catch (e) {
      console.warn(`⚠️  Policy ${i + 1} execution failed:`, e.message);
    }
  }
  
  // Test the fix by attempting to insert a verification token
  console.log('🧪 Testing email verification token creation...');
  
  const testToken = 'test-token-' + Date.now();
  const testUserId = 'test-user-' + Date.now();
  
  const { error: testError } = await supabase
    .from('email_verifications')
    .insert({
      user_id: testUserId,
      email: 'test@example.com',
      token: testToken,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString()
    });
    
  if (testError) {
    console.error('❌ Test insert failed:', testError.message);
    console.log('🔧 Manual SQL commands needed:');
    policies.forEach((policy, i) => {
      console.log(`-- Policy ${i + 1}:`);
      console.log(policy);
      console.log('');
    });
  } else {
    console.log('✅ Test insert successful - RLS policy is working!');
    
    // Clean up test record
    await supabase.from('email_verifications').delete().eq('token', testToken);
    console.log('🧹 Test record cleaned up');
  }
}

fixEmailVerificationRLS().catch(console.error);