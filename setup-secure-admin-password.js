require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generate a secure random password
function generateSecurePassword(length = 16) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(crypto.randomInt(0, charset.length));
  }
  
  return password;
}

async function setupSecureAdminPassword() {
  console.log('🔐 Setting up production-grade admin authentication...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Generate secure password
    const securePassword = generateSecurePassword(20);
    console.log('🎲 Generated secure password:', securePassword);
    console.log('⚠️  SAVE THIS PASSWORD SECURELY - IT WILL NOT BE SHOWN AGAIN!');
    
    // Hash the password with high cost factor
    console.log('🔨 Hashing password with bcrypt (cost: 12)...');
    const passwordHash = await bcrypt.hash(securePassword, 12);
    
    // Update the admin user with secure password
    const { data, error } = await supabase
      .from('team_users')
      .upsert({
        id: '3bd0125c-628a-451d-9434-e5441c43e402', // Existing admin ID
        email: 'admin@fisherbackflows.com',
        first_name: 'Admin',
        last_name: 'Fisher',
        role: 'admin',
        password_hash: passwordHash,
        is_active: true,
        failed_login_attempts: 0,
        last_failed_login: null,
        account_locked_until: null,
        password_changed_at: new Date().toISOString(),
        require_password_change: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('❌ Error updating admin user:', error);
      return;
    }

    console.log('✅ Admin user updated successfully!');
    
    // Test the password
    console.log('🧪 Testing password authentication...');
    const testResult = await bcrypt.compare(securePassword, passwordHash);
    console.log('✅ Password test result:', testResult ? 'PASS' : 'FAIL');
    
    // Output credentials for secure storage
    console.log('\n' + '='.repeat(60));
    console.log('🔐 PRODUCTION ADMIN CREDENTIALS');
    console.log('='.repeat(60));
    console.log('Email:', 'admin@fisherbackflows.com');
    console.log('Password:', securePassword);
    console.log('='.repeat(60));
    console.log('⚠️  STORE THESE CREDENTIALS IN A SECURE PASSWORD MANAGER');
    console.log('⚠️  DELETE THIS CONSOLE OUTPUT AFTER SAVING');
    console.log('='.repeat(60));
    
    // Log security event
    await supabase.from('security_logs').insert({
      event_type: 'password_reset_admin',
      ip_address: 'system',
      user_email: 'admin@fisherbackflows.com',
      user_agent: 'setup-script',
      success: true,
      timestamp: new Date().toISOString(),
      metadata: {
        action: 'production_password_setup',
        password_strength: 'high',
        hash_cost: 12
      }
    });
    
  } catch (error) {
    console.error('💥 Setup failed:', error);
  }
}

setupSecureAdminPassword();