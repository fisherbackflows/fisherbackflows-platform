require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAuth() {
  console.log('🧪 Testing admin auth directly...');
  
  try {
    // Try to sign in with Supabase Auth directly
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@fisherbackflows.com',
      password: 'admin123'
    });
    
    if (error) {
      console.error('❌ Direct auth failed:', error.message);
      
      // Let's try some other common passwords
      const commonPasswords = ['admin', 'password', 'FisherAdmin2025'];
      
      for (const pwd of commonPasswords) {
        console.log(`🔍 Trying password: ${pwd}`);
        const { data: testData, error: testError } = await supabase.auth.signInWithPassword({
          email: 'admin@fisherbackflows.com',
          password: pwd
        });
        
        if (!testError) {
          console.log(`✅ SUCCESS! Working password is: ${pwd}`);
          return;
        }
      }
      
      console.log('❌ None of the common passwords worked');
      
    } else {
      console.log('✅ Direct auth successful!', data.user.email);
    }
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testAuth();