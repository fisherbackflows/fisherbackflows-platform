#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function resetCustomerPassword() {
  console.log('\n🔐 Resetting Customer Password\n');
  console.log('='.repeat(60));
  
  const supabaseUrl = 'https://jvhbqfueutvfepsjmztx.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  const customerEmail = 'customer@fisherbackflows.com';
  const newPassword = 'Knvgtch6r91!';
  
  console.log('🔍 Finding customer account...');
  console.log(`   Email: ${customerEmail}`);
  console.log(`   New Password: ${newPassword}`);
  console.log('');
  
  try {
    // Find the user ID from the customer record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('email', customerEmail)
      .single();
    
    if (customerError) {
      console.error('❌ Customer not found:', customerError.message);
      return;
    }
    
    console.log('✅ Customer found, updating password...');
    console.log(`   User ID: ${customer.id}`);
    
    // Update the password using Supabase Admin API
    const { data, error } = await supabase.auth.admin.updateUserById(
      customer.id,
      { password: newPassword }
    );
    
    if (error) {
      console.error('❌ Password update failed:', error.message);
    } else {
      console.log('🎉 SUCCESS! Password updated successfully');
      console.log('\n📋 LOGIN CREDENTIALS:');
      console.log(`   Email: ${customerEmail}`);
      console.log(`   Password: ${newPassword}`);
      console.log(`   Login URL: https://www.fisherbackflows.com/portal`);
      
      console.log('\n🔒 SECURITY NOTE:');
      console.log('   The password has been updated in Supabase Auth');
      console.log('   Customer can now login with these credentials');
      
      // Test the login immediately
      console.log('\n🧪 Testing login with new credentials...');
      const { data: loginTest, error: loginError } = await supabase.auth.signInWithPassword({
        email: customerEmail,
        password: newPassword
      });
      
      if (loginError) {
        console.error('❌ Login test failed:', loginError.message);
      } else {
        console.log('✅ LOGIN TEST SUCCESSFUL!');
        console.log(`   Session created for user: ${loginTest.user.id}`);
        console.log('   Customer can now login on the website');
        
        // Sign out to clean up the test session
        await supabase.auth.signOut();
      }
    }
    
  } catch (error) {
    console.error('❌ Reset error:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Password Reset: COMPLETE\n');
}

resetCustomerPassword().catch(console.error);