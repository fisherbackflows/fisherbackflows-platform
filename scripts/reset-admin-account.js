#!/usr/bin/env node

/**
 * Reset Admin Account Script
 * Clears lockout status and failed login attempts for admin account
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function resetAdminAccount() {
  console.log('🔓 Resetting admin account lockout status...');
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.log('Required variables:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    const adminEmail = 'admin@fisherbackflows.com';
    
    // Check if admin user exists
    const { data: user, error: fetchError } = await supabase
      .from('team_users')
      .select('id, email, failed_login_attempts, account_locked_until, last_failed_login')
      .eq('email', adminEmail)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching admin user:', fetchError.message);
      
      if (fetchError.code === 'PGRST116') {
        console.log('📝 Admin user not found. Let me check what users exist...');
        
        const { data: allUsers, error: listError } = await supabase
          .from('team_users')
          .select('id, email, role')
          .limit(10);
        
        if (listError) {
          console.error('❌ Error listing users:', listError.message);
        } else {
          console.log('👥 Existing users:');
          allUsers.forEach(u => console.log(`   - ${u.email} (${u.role})`));
        }
      }
      return;
    }
    
    console.log('👤 Found admin user:', user.email);
    console.log('📊 Current status:');
    console.log(`   - Failed attempts: ${user.failed_login_attempts || 0}`);
    console.log(`   - Locked until: ${user.account_locked_until || 'Not locked'}`);
    console.log(`   - Last failed: ${user.last_failed_login || 'Never'}`);
    
    // Reset the account
    const { data, error: updateError } = await supabase
      .from('team_users')
      .update({
        failed_login_attempts: 0,
        account_locked_until: null,
        last_failed_login: null,
        is_active: true
      })
      .eq('email', adminEmail)
      .select();
    
    if (updateError) {
      console.error('❌ Error resetting account:', updateError.message);
      return;
    }
    
    // Clear any existing sessions
    const { error: sessionError } = await supabase
      .from('team_sessions')
      .delete()
      .eq('team_user_id', user.id);
    
    if (sessionError) {
      console.log('⚠️  Warning: Could not clear sessions:', sessionError.message);
    } else {
      console.log('🗑️  Cleared existing sessions');
    }
    
    console.log('✅ Admin account reset successfully!');
    console.log('');
    console.log('🔑 Login credentials:');
    console.log('   Email: admin@fisherbackflows.com');
    console.log('   Password: FisherAdmin2025');
    console.log('');
    console.log('🌐 You can now log in at:');
    console.log('   - Team Portal: http://localhost:3010/team-portal');
    console.log('   - Admin Portal: http://localhost:3010/admin/dashboard');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the script
resetAdminAccount()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Script failed:', err);
    process.exit(1);
  });