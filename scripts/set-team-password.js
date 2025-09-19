#!/usr/bin/env node
/**
 * Set Team User Password
 * Creates/updates password hash for team user authentication testing
 */

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

async function setTeamPassword() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Hash the password
  const password = 'admin123456789'; // Meeting 12+ character requirement
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  console.log('🔒 Setting password for admin@fisherbackflows.com');
  console.log(`   Password: ${password}`);
  console.log(`   Hash: ${hashedPassword}`);

  // Update the team user
  const { data, error } = await supabase
    .from('team_users')
    .update({ 
      password_hash: hashedPassword,
      failed_login_attempts: 0,
      last_failed_login: null,
      account_locked_until: null,
      is_active: true
    })
    .eq('email', 'admin@fisherbackflows.com')
    .select('*');

  if (error) {
    console.error('❌ Error updating password:', error);
    process.exit(1);
  }

  if (data && data.length > 0) {
    console.log('✅ Team user password updated successfully');
    console.log('User:', data[0]);
  } else {
    console.log('⚠️  No team user found with email admin@fisherbackflows.com');
  }
}

setTeamPassword().catch(console.error);