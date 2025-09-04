#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTable() {
  console.log('Checking if email_verifications table exists...');
  
  try {
    const { data, error } = await supabase
      .from('email_verifications')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Table does not exist:', error.message);
      console.log('\n📝 Please run this SQL in Supabase Dashboard:');
      console.log('https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx/sql\n');
      console.log(`CREATE TABLE email_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_verifications_token ON email_verifications(token);

ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role access" ON email_verifications
  FOR ALL TO service_role USING (true);`);
    } else {
      console.log('✅ Table exists and is accessible!');
      console.log('Ready to retrigger verification emails.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkTable();