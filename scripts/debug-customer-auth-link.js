#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function debugCustomerAuthLink() {
  console.log('🔍 DEBUGGING CUSTOMER <-> AUTH USER LINK');
  console.log('This will check if customer records have proper auth_user_id connections\n');

  try {
    const supabase = createClient(
      'https://jvhbqfueutvfepsjmztx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY'
    );

    // Step 1: Get recent customer records
    console.log('📋 Step 1: Checking recent customer records...');
    
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name, auth_user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (customerError) {
      console.error('❌ Could not fetch customers:', customerError.message);
      return false;
    }

    console.log(`Found ${customers.length} recent customers:`);
    customers.forEach((customer, i) => {
      console.log(`   ${i + 1}. ${customer.first_name} ${customer.last_name} (${customer.email})`);
      console.log(`      ID: ${customer.id}`);
      console.log(`      Auth User ID: ${customer.auth_user_id || 'NULL - THIS IS THE PROBLEM!'}`);
      console.log(`      Created: ${customer.created_at}`);
    });

    // Step 2: Check if Supabase Auth has users with matching emails
    console.log('\n🔐 Step 2: Checking Supabase Auth users...');
    
    // We can't directly query auth.users from client, but we can try to sign in
    for (const customer of customers.slice(0, 2)) { // Check first 2 customers
      console.log(`\n   Testing auth for: ${customer.email}`);
      
      try {
        // Try to get user info by attempting password reset
        const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(
          customer.email,
          { redirectTo: 'https://fisherbackflows.com/reset-password' }
        );
        
        if (resetError) {
          if (resetError.message.includes('User not found') || resetError.message.includes('not exist')) {
            console.log('   ❌ No auth user found for this email - auth creation failed');
          } else {
            console.log(`   ⚠️  Auth user exists but error: ${resetError.message}`);
          }
        } else {
          console.log('   ✅ Auth user exists (password reset email would be sent)');
        }
      } catch (authTest) {
        console.log(`   ⚠️  Auth test failed: ${authTest.message}`);
      }
    }

    // Step 3: Identify the specific issue
    console.log('\n🎯 Step 3: DIAGNOSIS');
    
    const customersWithoutAuthId = customers.filter(c => !c.auth_user_id);
    const customersWithAuthId = customers.filter(c => c.auth_user_id);
    
    console.log(`   • Customers without auth_user_id: ${customersWithoutAuthId.length}`);
    console.log(`   • Customers with auth_user_id: ${customersWithAuthId.length}`);
    
    if (customersWithoutAuthId.length > 0) {
      console.log('\n❌ PROBLEM IDENTIFIED: Customers exist without auth_user_id');
      console.log('This means the registration process is NOT properly linking customer records to Supabase Auth users.');
      console.log('\nThis could be caused by:');
      console.log('1. RLS policies blocking the UPDATE after auth user creation');
      console.log('2. Transaction rollback during registration process');
      console.log('3. Race condition in the registration API');
      
      console.log('\n🔧 RECOMMENDED FIX:');
      console.log('1. Check the registration API route to ensure it updates auth_user_id');
      console.log('2. Make sure service role can UPDATE customer records');
      console.log('3. Test the complete registration flow');
      
      // Try to manually link one customer for testing
      if (customersWithoutAuthId.length > 0) {
        const testCustomer = customersWithoutAuthId[0];
        console.log(`\n🧪 TESTING: Attempting to sign in as ${testCustomer.email} to get auth user ID...`);
        
        // Try signing in with a test password
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testCustomer.email,
          password: 'testpass123' // This was the password used in registration
        });
        
        if (signInError) {
          console.log(`   ❌ Sign-in failed: ${signInError.message}`);
          if (signInError.message.includes('Invalid credentials')) {
            console.log('   This means the auth user exists but password is wrong, or it doesn\'t exist');
          }
        } else if (signInData.user) {
          console.log(`   ✅ Sign-in successful! Auth user ID: ${signInData.user.id}`);
          console.log('   📝 The auth user exists but is not linked to the customer record');
          
          // Try to update the customer record with the auth_user_id
          console.log(`   🔗 Attempting to link customer record...`);
          const { data: updateData, error: updateError } = await supabase
            .from('customers')
            .update({ auth_user_id: signInData.user.id })
            .eq('id', testCustomer.id)
            .select('id, email, auth_user_id');
            
          if (updateError) {
            console.log(`   ❌ Failed to link: ${updateError.message}`);
            console.log('   This confirms RLS policies are blocking the UPDATE');
          } else {
            console.log(`   ✅ Successfully linked! Customer record updated.`);
            console.log('   🧪 Now test login again - it should work for this customer');
          }
        }
      }
    } else {
      console.log('✅ All customers have auth_user_id - issue may be elsewhere');
    }

    return true;

  } catch (error) {
    console.error('💥 Debug script failed:', error.message);
    return false;
  }
}

debugCustomerAuthLink();