#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Use service role key for admin operations
const supabase = createClient(
  'https://jvhbqfueutvfepsjmztx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY'
);

async function executeSchemas() {
  console.log('🚀 Attempting automated schema deployment...\n');

  // Step 1: Try to create water_districts table first
  console.log('📋 Creating water_districts table...');
  
  try {
    const { data, error } = await supabase
      .from('water_districts')
      .select('*')
      .limit(1);
      
    if (!error) {
      console.log('✅ water_districts table already exists');
    }
  } catch (err) {
    console.log('🔄 water_districts table does not exist, will create...');
  }

  // Step 2: Try to create billing tables
  console.log('📋 Checking billing_subscriptions table...');
  
  try {
    const { data, error } = await supabase
      .from('billing_subscriptions')
      .select('*')
      .limit(1);
      
    if (!error) {
      console.log('✅ billing_subscriptions table already exists');
    }
  } catch (err) {
    console.log('🔄 billing_subscriptions table does not exist, will create...');
  }

  console.log('\n❌ Automated deployment not possible via REST API');
  console.log('\n🎯 SOLUTION: Use one of these methods:\n');

  console.log('📋 METHOD 1: Manual Supabase SQL Editor');
  console.log('1. Go to: https://supabase.com/dashboard/project/jvhbqfueutvfepsjmztx');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy/paste from: execute-schemas-direct.sql');
  console.log('4. Click "Run"');

  console.log('\n📋 METHOD 2: PostgreSQL Connection (if you have psql)');
  console.log('psql "postgresql://postgres:[YOUR-PASSWORD]@db.jvhbqfueutvfepsjmztx.supabase.co:5432/postgres" < execute-schemas-direct.sql');

  console.log('\n📋 METHOD 3: Supabase CLI (recommended)');
  console.log('1. npx supabase login');
  console.log('2. npx supabase link --project-ref jvhbqfueutvfepsjmztx');
  console.log('3. npx supabase db push');

  console.log('\n💡 All files are ready for deployment. Choose your preferred method.');
}

executeSchemas().catch(console.error);