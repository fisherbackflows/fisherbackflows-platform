#!/usr/bin/env node

/**
 * Complete Auth Cleanup Script
 * Removes all test auth users (including orphaned ones) and clears sessions
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupAllTestAuth() {
  try {
    console.log('🔐 Starting complete auth cleanup...');

    // Get all auth users with @example.com emails (including orphaned ones)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Failed to list auth users: ${authError.message}`);
    }

    const testAuthUsers = authUsers.users?.filter(user => 
      user.email && user.email.includes('@example.com')
    ) || [];

    if (testAuthUsers.length === 0) {
      console.log('✅ No test auth users found. Auth is clean.');
      return;
    }

    console.log(`📋 Found ${testAuthUsers.length} test auth users:`);
    testAuthUsers.forEach(user => {
      console.log(`   - ${user.email} (ID: ${user.id.substring(0, 8)}...)`);
    });

    // Delete each auth user
    console.log('\n🗑️  Deleting test auth users...');
    for (const user of testAuthUsers) {
      try {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteError) {
          console.warn(`⚠️  Warning deleting ${user.email}: ${deleteError.message}`);
        } else {
          console.log(`   ✅ Deleted: ${user.email}`);
        }
      } catch (err) {
        console.warn(`⚠️  Error deleting ${user.email}: ${err.message}`);
      }
    }

    // Also sign out all sessions (clears any remaining tokens)
    console.log('\n🚪 Signing out all sessions...');
    try {
      const { error: signOutError } = await supabase.auth.admin.signOut('global');
      if (signOutError) {
        console.warn(`⚠️  Warning signing out sessions: ${signOutError.message}`);
      } else {
        console.log('   ✅ All sessions cleared');
      }
    } catch (err) {
      console.warn(`⚠️  Error clearing sessions: ${err.message}`);
    }

    console.log('\n🎉 Complete auth cleanup finished!');
    console.log('🔒 All test logins and sessions cleared');

  } catch (error) {
    console.error('\n❌ Auth cleanup failed:', error.message);
    process.exit(1);
  }
}

// Run cleanup
cleanupAllTestAuth();