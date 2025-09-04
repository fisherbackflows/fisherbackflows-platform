#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function setupTable() {
  console.log('🔧 Setting up email_verifications table...\n');
  
  try {
    // Check if table exists by trying to query it
    const { data, error: queryError } = await supabase
      .from('email_verifications')
      .select('id')
      .limit(1);
    
    if (!queryError) {
      console.log('✅ email_verifications table already exists!');
      return;
    }
    
    console.log('Creating table manually in database...');
    console.log('\nPlease run this SQL in your Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx/sql\n');
    
    console.log(`-- Create email_verifications table
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);

-- Enable RLS
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Service role can manage email verifications" ON email_verifications
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);`);
    
    console.log('\nAfter running the SQL, your Resend-only system will be ready!');
    
  } catch (error) {
    console.error('Error checking table:', error);
  }
}

setupTable().catch(console.error);