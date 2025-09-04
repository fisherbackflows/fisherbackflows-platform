#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function debugCustomerLogin() {
  console.log('\n🔍 Debugging Customer Login Issue\n');
  console.log('='.repeat(60));
  
  const supabaseUrl = 'https://jvhbqfueutvfepsjmztx.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  const customerEmail = 'customer@fisherbackflows.com';
  
  console.log('🔍 Checking customer account status...');
  console.log(`   Email: ${customerEmail}`);
  console.log('');
  
  try {
    // Check customer record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', customerEmail)
      .single();
    
    if (customerError) {
      console.error('❌ Customer record error:', customerError);
    } else if (customer) {
      console.log('✅ CUSTOMER RECORD FOUND:');
      console.log(`   ID: ${customer.id}`);
      console.log(`   Account Number: ${customer.account_number}`);
      console.log(`   Name: ${customer.first_name} ${customer.last_name}`);
      console.log(`   Email: ${customer.email}`);
      console.log(`   Phone: ${customer.phone}`);
      console.log(`   Status: ${customer.account_status}`);
      console.log(`   Created: ${customer.created_at}`);
      console.log('');
    } else {
      console.log('❌ NO CUSTOMER RECORD FOUND');
      console.log('');
    }
    
    // Check auth user
    console.log('🔍 Checking Supabase Auth user...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Auth users error:', authError);
    } else {
      const customerAuthUser = authUsers.users.find(user => user.email === customerEmail);
      
      if (customerAuthUser) {
        console.log('✅ AUTH USER FOUND:');
        console.log(`   ID: ${customerAuthUser.id}`);
        console.log(`   Email: ${customerAuthUser.email}`);
        console.log(`   Email Confirmed: ${customerAuthUser.email_confirmed_at ? 'Yes' : 'No'}`);
        console.log(`   Phone: ${customerAuthUser.phone || 'None'}`);
        console.log(`   Created: ${customerAuthUser.created_at}`);
        console.log(`   Last Sign In: ${customerAuthUser.last_sign_in_at || 'Never'}`);
        console.log(`   Confirmed At: ${customerAuthUser.email_confirmed_at || 'Not confirmed'}`);
        console.log('   User Metadata:', JSON.stringify(customerAuthUser.user_metadata, null, 2));
        console.log('');
        
        // Test password verification attempt
        console.log('🔍 Testing login attempt...');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: customerEmail,
          password: 'TestPassword123' // Common test password
        });
        
        if (loginError) {
          console.log('❌ LOGIN FAILED:');
          console.log(`   Error: ${loginError.message}`);
          console.log(`   Status: ${loginError.status || 'Unknown'}`);
          
          if (loginError.message.includes('Invalid login credentials')) {
            console.log('\n🔧 LIKELY ISSUE: Password mismatch or email not confirmed');
            console.log('   - The password used during registration might be different');
            console.log('   - Or email confirmation is required for login');
          }
          
          if (loginError.message.includes('Email not confirmed')) {
            console.log('\n🔧 SOLUTION: Email needs to be confirmed in Auth');
            console.log('   - Try manually confirming email in Supabase Auth');
          }
        } else {
          console.log('✅ LOGIN SUCCESSFUL:');
          console.log(`   User ID: ${loginData.user.id}`);
          console.log(`   Session: ${loginData.session ? 'Active' : 'None'}`);
        }
      } else {
        console.log('❌ NO AUTH USER FOUND');
        console.log('   This means the user was not created in Supabase Auth');
        console.log('   Registration may have failed or been incomplete');
      }
    }
    
    console.log('\n🎯 DIAGNOSIS:');
    if (!customer) {
      console.log('   ❌ No customer record - registration failed completely');
    } else if (!authUsers.users.find(user => user.email === customerEmail)) {
      console.log('   ❌ Customer record exists but no auth user - auth creation failed');
    } else {
      const authUser = authUsers.users.find(user => user.email === customerEmail);
      if (customer.account_status !== 'active') {
        console.log('   ⚠️  Customer account status is not "active"');
        console.log('   ✅ Email verification may not have completed properly');
      }
      if (!authUser.email_confirmed_at) {
        console.log('   ⚠️  Email is not confirmed in Supabase Auth');
        console.log('   ✅ This could prevent login even if customer record is active');
      }
      if (customer.account_status === 'active' && authUser.email_confirmed_at) {
        console.log('   ⚠️  Both records look good - likely a password issue');
      }
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Customer Login Debug: COMPLETE\n');
}

debugCustomerLogin().catch(console.error);