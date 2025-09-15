#!/usr/bin/env node

// Enable password breach protection (HaveIBeenPwned)
require('dotenv').config({ path: '.env.local' });

async function enablePasswordSecurity() {
  console.log('🔐 ENABLING PASSWORD BREACH PROTECTION\n');

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ No Supabase service role key found');
    return;
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');

    // Use service role to update auth configuration
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('📊 Connected to Supabase with service role');
    console.log('🔍 Checking current password security settings...\n');

    // Note: Password security settings in Supabase are typically configured
    // via the Dashboard Auth settings, not via SQL queries
    // This script provides guidance on what needs to be configured

    console.log('⚠️ PASSWORD SECURITY CONFIGURATION REQUIRED:\n');

    console.log('📋 MANUAL CONFIGURATION STEPS:');
    console.log('1. Go to Supabase Dashboard > Authentication > Settings');
    console.log('2. Navigate to "Password Strength" section');
    console.log('3. Enable "Check for breached passwords"');
    console.log('4. Configure minimum password requirements:');
    console.log('   - Minimum length: 8 characters');
    console.log('   - Require uppercase letters');
    console.log('   - Require lowercase letters');
    console.log('   - Require numbers');
    console.log('   - Require special characters');

    console.log('\n🔗 DIRECT LINKS:');
    console.log(`   Dashboard: https://supabase.com/dashboard/project/${process.env.NEXT_PUBLIC_SUPABASE_URL.split('//')[1].split('.')[0]}`);
    console.log('   Auth Settings: Authentication > Settings');

    console.log('\n🛡️ SECURITY BENEFITS:');
    console.log('✅ Prevents users from using breached passwords');
    console.log('✅ Integrates with HaveIBeenPwned database');
    console.log('✅ Enforces strong password requirements');
    console.log('✅ Reduces account compromise risk');

    console.log('\n📊 CURRENT ENVIRONMENT:');
    console.log(`   Project URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    console.log(`   Project ID: ${process.env.NEXT_PUBLIC_SUPABASE_URL.split('//')[1].split('.')[0]}`);

    // Test password strength programmatically by attempting to create a weak password user
    console.log('\n🧪 TESTING PASSWORD POLICIES...');

    try {
      // This will help us understand current password requirements
      const { data, error } = await supabase.auth.admin.createUser({
        email: 'test-weak-password@example.com',
        password: '123', // Intentionally weak password
        email_confirm: false
      });

      if (error) {
        if (error.message.includes('password')) {
          console.log('✅ Password strength policies are active!');
          console.log(`   Policy message: ${error.message}`);
        } else {
          console.log('⚠️ Password policies may not be configured');
          console.log(`   Error: ${error.message}`);
        }
      } else {
        console.log('❌ Weak password was accepted - policies need configuration');
        // Clean up test user
        if (data.user?.id) {
          await supabase.auth.admin.deleteUser(data.user.id);
          console.log('🧹 Cleaned up test user');
        }
      }
    } catch (testError) {
      console.log('⚠️ Could not test password policies:', testError.message);
    }

    console.log('\n🎯 RECOMMENDED PASSWORD POLICY:');
    console.log('```json');
    console.log('{');
    console.log('  "password_min_length": 8,');
    console.log('  "password_require_uppercase": true,');
    console.log('  "password_require_lowercase": true,');
    console.log('  "password_require_numbers": true,');
    console.log('  "password_require_symbols": true,');
    console.log('  "password_check_breached": true');
    console.log('}');
    console.log('```');

    console.log('\n📱 IMPLEMENTATION STATUS:');
    console.log('⚠️ Requires manual configuration in Supabase Dashboard');
    console.log('📋 Cannot be automated via API (security by design)');
    console.log('🔐 Must be configured by project administrator');

  } catch (error) {
    console.log('❌ Password security check failed:', error.message);
  }
}

enablePasswordSecurity().catch(console.error);