require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetAdminLogin() {
  console.log('🔧 Resetting admin login for portal testing...');
  
  try {
    // First, let's check if admin exists in customers table (needed for portal login)
    const { data: existingCustomer, error: checkError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', 'admin@fisherbackflows.com')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking customer:', checkError);
      return;
    }

    // Hash the password
    const password = 'FisherAdmin2025';
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create/update admin in customers table for portal access
    const adminCustomer = {
      email: 'admin@fisherbackflows.com',
      password_hash: passwordHash,
      first_name: 'Admin',
      last_name: 'User',
      phone: '(253) 278-8692',
      address_line1: '123 Admin St',
      city: 'Tacoma',
      state: 'WA',
      zip_code: '98401',
      account_status: 'active',
      account_number: 'ADMIN001'
    };

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .upsert(adminCustomer, { onConflict: 'email' })
      .select()
      .single();

    if (customerError) {
      console.error('❌ Error creating customer:', customerError);
      return;
    }

    console.log('✅ Admin customer record created/updated');

    // Now create the user in Supabase Auth (this is what the login API uses)
    console.log('🔑 Creating Supabase Auth user...');
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@fisherbackflows.com',
      password: password,
      email_confirm: true,
      user_metadata: {
        account_type: 'admin',
        role: 'admin'
      }
    });

    if (authError) {
      if (authError.message.includes('already been registered') || authError.code === 'email_exists') {
        console.log('📧 Auth user already exists, updating password...');
        
        // Get the user first to update by ID
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();
        const existingUser = users?.users?.find(u => u.email === 'admin@fisherbackflows.com');
        
        if (existingUser) {
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id, 
            { password: password }
          );
          
          if (updateError) {
            console.log('⚠️  Could not update password:', updateError.message);
          } else {
            console.log('✅ Password updated successfully');
          }
        }
      } else {
        console.error('❌ Auth user creation error:', authError);
        return;
      }
    } else {
      console.log('✅ Supabase Auth user created successfully');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 ADMIN PORTAL ACCESS READY');
    console.log('='.repeat(60));
    console.log('🌐 URL: https://www.fisherbackflows.com/portal');
    console.log('📧 Email: admin@fisherbackflows.com');
    console.log('🔑 Password: FisherAdmin2025');
    console.log('='.repeat(60));
    console.log('✅ Login will redirect to team portal automatically');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('💥 Reset failed:', error);
  }
}

resetAdminLogin();