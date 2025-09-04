#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCustomerAccount() {
  console.log('\n🔍 Checking customer@fisherbackflows.com Account Status\n');
  console.log('='.repeat(60));
  
  const email = 'customer@fisherbackflows.com';
  
  try {
    // Check in customers table
    console.log('📊 Checking customers table...');
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .single();
    
    if (customerError && customerError.code !== 'PGRST116') {
      console.error('❌ Customer query error:', customerError);
    } else if (customer) {
      console.log('✅ Found in customers table:');
      console.log(`   ID: ${customer.id}`);
      console.log(`   Email: ${customer.email}`);
      console.log(`   Name: ${customer.first_name} ${customer.last_name}`);
      console.log(`   Account Status: ${customer.account_status}`);
      console.log(`   Phone: ${customer.phone || 'Not set'}`);
      console.log(`   Created: ${customer.created_at}`);
      console.log(`   Email Verified: ${customer.email_verified_at || 'Not verified'}`);
    } else {
      console.log('❌ Not found in customers table');
    }
    
    console.log('\n👤 Checking auth.users table...');
    
    // Check in auth.users table
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Auth users query error:', authError);
    } else {
      const authUser = authUsers.users.find(user => user.email === email);
      if (authUser) {
        console.log('✅ Found in auth.users:');
        console.log(`   ID: ${authUser.id}`);
        console.log(`   Email: ${authUser.email}`);
        console.log(`   Email Confirmed: ${authUser.email_confirmed_at ? 'YES' : 'NO'}`);
        console.log(`   Created: ${authUser.created_at}`);
        console.log(`   Last Sign In: ${authUser.last_sign_in_at || 'Never'}`);
        console.log(`   Phone Confirmed: ${authUser.phone_confirmed_at ? 'YES' : 'NO'}`);
      } else {
        console.log('❌ Not found in auth.users');
      }
    }
    
    console.log('\n🎯 DIAGNOSIS:');
    
    if (customer && !customer.email_verified_at) {
      console.log('⚠️  Issue: Account exists but email not verified');
      console.log('💡 Solution: Complete email verification process');
    }
    
    if (customer && customer.account_status === 'pending_verification') {
      console.log('⚠️  Issue: Account status is pending verification');
      console.log('💡 Solution: Update account status after email verification');
    }
    
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    console.log('1. Verify email using the verification link sent');
    console.log('2. Or manually activate the account in database');
    console.log('3. Check if password was set correctly during registration');
    
  } catch (error) {
    console.error('❌ Error checking account:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Account check complete\n');
}

checkCustomerAccount();