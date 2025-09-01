// This script sets up admin access in the PRODUCTION Supabase instance
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Use the production Supabase instance
const supabase = createClient(
  'https://jvhbqfueutvfepsjmztx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupProductionAdmin() {
  console.log('🚀 Setting up PRODUCTION admin access...');
  console.log('📍 Supabase URL:', 'https://jvhbqfueutvfepsjmztx.supabase.co');
  
  try {
    // The password to set
    const password = 'FisherAdmin2025';
    
    // First, check if user exists in Supabase Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      return;
    }
    
    const existingUser = users?.find(u => u.email === 'admin@fisherbackflows.com');
    
    if (existingUser) {
      console.log('📧 Admin user exists, updating password...');
      
      // Update the existing user's password
      const { data, error } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { 
          password: password,
          email_confirm: true
        }
      );
      
      if (error) {
        console.error('❌ Error updating password:', error);
      } else {
        console.log('✅ Password updated successfully!');
      }
    } else {
      console.log('🆕 Creating new admin user...');
      
      // Create new user
      const { data, error } = await supabase.auth.admin.createUser({
        email: 'admin@fisherbackflows.com',
        password: password,
        email_confirm: true,
        user_metadata: {
          role: 'admin',
          account_type: 'admin'
        }
      });
      
      if (error) {
        console.error('❌ Error creating user:', error);
      } else {
        console.log('✅ Admin user created successfully!');
      }
    }
    
    // Also ensure the admin exists in customers table
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .upsert({
        email: 'admin@fisherbackflows.com',
        first_name: 'Admin',
        last_name: 'User',
        phone: '(253) 278-8692',
        address_line1: '123 Admin St',
        city: 'Tacoma',
        state: 'WA',
        zip_code: '98401',
        account_status: 'active',
        account_number: 'ADMIN001'
      }, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select()
      .single();
      
    if (customerError) {
      console.log('⚠️  Customer record issue:', customerError.message);
    } else {
      console.log('✅ Customer record ensured');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 PRODUCTION ADMIN ACCESS CONFIGURED');
    console.log('='.repeat(60));
    console.log('🌐 URL: https://www.fisherbackflows.com/portal');
    console.log('📧 Email: admin@fisherbackflows.com');
    console.log('🔑 Password: FisherAdmin2025');
    console.log('='.repeat(60));
    console.log('✅ This will work on the LIVE production site');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('💥 Setup failed:', error);
  }
}

setupProductionAdmin();