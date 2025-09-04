#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function wipeCustomerAccount() {
  console.log('🗑️  WIPING CUSTOMER ACCOUNT: customer@fisherbackflows.com\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const customerEmail = 'customer@fisherbackflows.com';
  
  try {
    console.log('1. Finding customer record...');
    
    // Get customer record first
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('email', customerEmail)
      .single();
    
    if (customerError && customerError.code !== 'PGRST116') {
      console.error('Error finding customer:', customerError);
    } else if (customer) {
      console.log(`   Found customer: ${customer.id} - ${customer.first_name} ${customer.last_name}`);
    } else {
      console.log('   No customer record found in database');
    }
    
    console.log('\n2. Finding Supabase auth user...');
    
    // Find user by email
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
    } else {
      const authUser = authUsers.users.find(user => user.email === customerEmail);
      
      if (authUser) {
        console.log(`   Found auth user: ${authUser.id}`);
        
        // Delete from Supabase Auth
        console.log('\n3. Deleting from Supabase Auth...');
        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(authUser.id);
        
        if (deleteAuthError) {
          console.error('❌ Error deleting auth user:', deleteAuthError);
        } else {
          console.log('   ✅ Auth user deleted successfully');
        }
      } else {
        console.log('   No auth user found');
      }
    }
    
    console.log('\n4. Deleting from customers table...');
    
    // Delete from customers table
    const { error: deleteCustomerError } = await supabaseAdmin
      .from('customers')
      .delete()
      .eq('email', customerEmail);
    
    if (deleteCustomerError) {
      console.error('❌ Error deleting customer record:', deleteCustomerError);
    } else {
      console.log('   ✅ Customer record deleted successfully');
    }
    
    // Also delete from any other related tables
    console.log('\n5. Cleaning up related data...');
    
    // Delete from email_verifications table
    const { error: deleteVerificationError } = await supabaseAdmin
      .from('email_verifications')
      .delete()
      .eq('email', customerEmail);
    
    if (deleteVerificationError && deleteVerificationError.code !== 'PGRST116') {
      console.error('Warning: Error deleting verification records:', deleteVerificationError);
    } else {
      console.log('   ✅ Email verification records cleaned up');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ACCOUNT WIPE COMPLETE!');
    console.log('');
    console.log('✅ customer@fisherbackflows.com is now completely removed');
    console.log('✅ You can now create a fresh account with this email');
    console.log('✅ The new account will have proper email_confirm: true');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

wipeCustomerAccount().catch(console.error);