const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createSmsTable() {
  console.log('🔧 Creating SMS verifications table in Supabase...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }

  // Use direct Supabase Management API
  const managementUrl = `${supabaseUrl}/rest/v1/rpc/query`;
  
  try {
    // First, let's try to insert a test record to force table creation
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if table exists by attempting to query it
    const { data: checkData, error: checkError } = await supabase
      .from('sms_verifications')
      .select('*')
      .limit(1);
    
    if (checkError && checkError.code === 'PGRST204') {
      console.log('✅ Table exists but is empty');
      return true;
    }
    
    if (checkError && checkError.code === 'PGRST205') {
      console.log('❌ Table does not exist');
      
      // Try using Supabase Management API with proper headers
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          query: `
            CREATE TABLE IF NOT EXISTS public.sms_verifications (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
              phone TEXT NOT NULL,
              code TEXT NOT NULL,
              attempts INTEGER DEFAULT 0,
              expires_at TIMESTAMPTZ NOT NULL,
              created_at TIMESTAMPTZ DEFAULT NOW()
            );
          `
        })
      });
      
      if (!response.ok) {
        // Alternative: Use SQL via pg-protocol
        console.log('⚠️  Direct SQL execution not available via REST API');
        console.log('');
        console.log('📋 Please execute this SQL in Supabase Dashboard:');
        console.log('================================================');
        console.log(`
-- Create SMS verification table
CREATE TABLE IF NOT EXISTS public.sms_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sms_verifications ENABLE ROW LEVEL SECURITY;

-- Service role policy
CREATE POLICY "Service role full access" ON public.sms_verifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- User read policy  
CREATE POLICY "Users read own" ON public.sms_verifications
  FOR SELECT TO authenticated USING (customer_id = auth.uid());
        `);
        console.log('================================================');
        console.log('');
        console.log('🔗 Go to: https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx/sql/new');
        return false;
      }
      
      const result = await response.json();
      console.log('✅ Table created:', result);
      return true;
    }
    
    console.log('✅ Table already exists');
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Execute
createSmsTable().then(success => {
  if (success) {
    console.log('✅ SMS verifications table ready');
  } else {
    console.log('⚠️  Manual table creation required in Supabase dashboard');
  }
});