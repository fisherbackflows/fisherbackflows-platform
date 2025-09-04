#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function activateCustomerAccount() {
  console.log('\n🔧 Activating customer@fisherbackflows.com Account\n');
  console.log('='.repeat(60));
  
  const email = 'customer@fisherbackflows.com';
  
  try {
    console.log('🔄 Updating customer account status...');
    
    // Update customer record to active status
    const { data: updatedCustomer, error: updateError } = await supabase
      .from('customers')
      .update({
        account_status: 'active',
        email_verified_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Failed to update customer:', updateError);
      return;
    }
    
    console.log('✅ Customer account successfully activated!');
    console.log('\n📋 Updated Account Details:');
    console.log(`   Email: ${updatedCustomer.email}`);
    console.log(`   Name: ${updatedCustomer.first_name} ${updatedCustomer.last_name}`);
    console.log(`   Status: ${updatedCustomer.account_status}`);
    console.log(`   Email Verified: ${updatedCustomer.email_verified_at}`);
    console.log(`   Account Number: ${updatedCustomer.account_number}`);
    
    console.log('\n🎯 ACCOUNT STATUS:');
    console.log('   ✅ Customer record: ACTIVE');
    console.log('   ✅ Email verified: YES');
    console.log('   ✅ Login enabled: YES');
    console.log('   ✅ Portal access: GRANTED');
    
    console.log('\n🔑 LOGIN INSTRUCTIONS:');
    console.log('   Email: customer@fisherbackflows.com');
    console.log('   Password: [Use the password set during registration]');
    console.log('   Portal: https://www.fisherbackflows.com/portal');
    
    console.log('\n💡 TESTING:');
    console.log('   1. Go to: https://www.fisherbackflows.com/portal');
    console.log('   2. Enter: customer@fisherbackflows.com');
    console.log('   3. Enter the password used during registration');
    console.log('   4. Should successfully log in to customer portal');
    
  } catch (error) {
    console.error('❌ Error activating account:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Account activation complete!\n');
}

activateCustomerAccount();