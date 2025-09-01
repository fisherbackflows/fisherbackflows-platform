require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Test directly against production Supabase
const supabase = createClient(
  'https://jvhbqfueutvfepsjmztx.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Use anon key for auth testing
);

async function testProductionAuth() {
  console.log('🧪 Testing production Supabase auth directly...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@fisherbackflows.com',
      password: 'FisherAdmin2025'
    });
    
    if (error) {
      console.error('❌ Auth failed:', error.message);
      
      // Try with the anon key to see if it's a key issue
      console.log('\n🔍 Checking with service key...');
      const supabaseService = createClient(
        'https://jvhbqfueutvfepsjmztx.supabase.co',
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      const { data: serviceData, error: serviceError } = await supabaseService.auth.signInWithPassword({
        email: 'admin@fisherbackflows.com',
        password: 'FisherAdmin2025'
      });
      
      if (serviceError) {
        console.error('❌ Service key auth also failed:', serviceError.message);
      } else {
        console.log('✅ Auth works with service key!');
      }
    } else {
      console.log('✅ Auth successful!', data.user.email);
      console.log('User ID:', data.user.id);
    }
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testProductionAuth();