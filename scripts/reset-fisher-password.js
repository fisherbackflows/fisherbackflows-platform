require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetFisherPassword() {
  try {
    console.log('🔑 Resetting Fisher Backflows admin password...');

    // New password - you can change this
    const newPassword = 'FisherAdmin2025!';
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the password for the Fisher Backflows admin account
    const { data, error } = await supabase
      .from('team_users')
      .update({
        password_hash: hashedPassword,
        password_changed_at: new Date().toISOString(),
        require_password_change: false,
        failed_login_attempts: 0,
        account_locked_until: null,
        updated_at: new Date().toISOString()
      })
      .eq('email', 'admin@fisherbackflows.com')
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating password:', error);
      return;
    }

    console.log('✅ Password updated successfully!');
    console.log('\n🎉 Fisher Backflows Admin Login Details:');
    console.log('📧 Email:', data.email);
    console.log('🔐 New Password:', newPassword);
    console.log('👤 Role:', data.role);
    console.log('📅 Password Changed:', data.password_changed_at);
    console.log('\n🔗 Login URL:');
    console.log('   Local:  http://localhost:3010/team-portal/login');
    console.log('   Live:   https://fisherbackflows.com/team-portal/login');
    console.log('\n⚠️  Important: Please change this password after your first login!');

  } catch (error) {
    console.error('❌ Error resetting password:', error);
  }
}

resetFisherPassword();