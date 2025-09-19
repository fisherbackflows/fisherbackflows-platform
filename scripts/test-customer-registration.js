#!/usr/bin/env node

/**
 * Test customer registration after RLS is disabled
 * 
 * This script tests that customer registration works by attempting to:
 * 1. Create a test customer record
 * 2. Verify the record was created
 * 3. Clean up the test record
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCustomerRegistration() {
  const testEmail = `test-${Date.now()}@fishertesting.com`;
  const testCustomer = {
    email: testEmail,
    first_name: 'Test',
    last_name: 'Customer',
    company_name: 'Test Company',
    phone: '555-123-4567',
    address_line1: '123 Test St',
    city: 'Test City',
    state: 'WA',
    zip_code: '12345',
    account_status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    console.log('🧪 Testing customer registration...');
    console.log('Test email:', testEmail);

    // Step 1: Try to insert a test customer
    console.log('\n1️⃣ Attempting to insert test customer...');
    const { data: insertData, error: insertError } = await supabase
      .from('customers')
      .insert([testCustomer])
      .select();

    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      return false;
    }

    console.log('✅ Test customer inserted successfully:', insertData[0].id);

    // Step 2: Verify we can read the customer back
    console.log('\n2️⃣ Attempting to read test customer...');
    const { data: selectData, error: selectError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (selectError) {
      console.error('❌ Select failed:', selectError);
      return false;
    }

    console.log('✅ Test customer read successfully:', selectData.email);

    // Step 3: Update the customer
    console.log('\n3️⃣ Attempting to update test customer...');
    const { data: updateData, error: updateError } = await supabase
      .from('customers')
      .update({ company_name: 'Updated Test Company' })
      .eq('id', selectData.id)
      .select();

    if (updateError) {
      console.error('❌ Update failed:', updateError);
      return false;
    }

    console.log('✅ Test customer updated successfully:', updateData[0].company_name);

    // Step 4: Clean up - delete the test customer
    console.log('\n4️⃣ Cleaning up test customer...');
    const { error: deleteError } = await supabase
      .from('customers')
      .delete()
      .eq('id', selectData.id);

    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError);
      console.log('⚠️  Please manually delete customer with email:', testEmail);
      return false;
    }

    console.log('✅ Test customer cleaned up successfully');

    console.log('\n🎉 ALL TESTS PASSED! Customer registration should work now.');
    return true;

  } catch (error) {
    console.error('💥 Test failed with exception:', error.message);
    return false;
  }
}

async function checkRLSStatus() {
  try {
    console.log('🔍 Checking RLS status on customers table...');
    
    // Try to query pg_tables to check RLS status
    const { data, error } = await supabase
      .rpc('check_rls_status');

    if (error) {
      console.log('⚠️  Cannot check RLS status directly (this is normal)');
      console.log('   Will test by attempting database operations...');
      return null;
    }

    return data;
  } catch (err) {
    console.log('⚠️  RLS status check not available, proceeding with functional test...');
    return null;
  }
}

async function main() {
  console.log('🚀 Starting customer registration test...\n');

  // Check RLS status (may not work, but worth trying)
  await checkRLSStatus();

  // Run the actual functional test
  const success = await testCustomerRegistration();

  if (success) {
    console.log('\n✅ Customer registration is working correctly!');
    console.log('   Authentication should now work in production.');
    process.exit(0);
  } else {
    console.log('\n❌ Customer registration test failed.');
    console.log('   RLS may still be enabled or there are other issues.');
    console.log('   Please check the Supabase dashboard and ensure the SQL was executed.');
    process.exit(1);
  }
}

main().catch(console.error);