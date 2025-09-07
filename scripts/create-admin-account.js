const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdminAccount() {
  console.log('🔐 Creating admin account for Fisher Backflows...\n');

  // Admin credentials
  const adminEmail = 'admin@fisherbackflows.com';
  const adminPassword = 'Admin123!@#'; // Strong default password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  try {
    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('team_users')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (existingAdmin) {
      console.log('✅ Admin account already exists!');
      console.log('\n📧 Email:', adminEmail);
      console.log('🔑 Current Role:', existingAdmin.role);
      
      // Update password if needed
      const { error: updateError } = await supabase
        .from('team_users')
        .update({ 
          password_hash: hashedPassword,
          is_active: true,
          failed_login_attempts: 0,
          account_locked_until: null
        })
        .eq('email', adminEmail);

      if (!updateError) {
        console.log('🔄 Password has been reset to:', adminPassword);
      }
      return;
    }

    // Create new admin account
    const { data: newAdmin, error } = await supabase
      .from('team_users')
      .insert({
        email: adminEmail,
        password_hash: hashedPassword,
        role: 'admin',
        first_name: 'Admin',
        last_name: 'User',
        is_active: true,
        failed_login_attempts: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating admin:', error.message);
      return;
    }

    console.log('✅ Admin account created successfully!\n');
    console.log('========================================');
    console.log('🎯 ADMIN CREDENTIALS');
    console.log('========================================');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('🌐 Login URL: https://fisherbackflows.com/team-portal/login');
    console.log('========================================');
    console.log('\n⚠️  IMPORTANT: Change this password after first login!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAdminAccount();