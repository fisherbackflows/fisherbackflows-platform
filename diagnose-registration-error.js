#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function diagnoseRegistrationError() {
  console.log('\n🔍 DIAGNOSING REGISTRATION "User not allowed" ERROR\n');
  console.log('='.repeat(70));
  
  const supabaseUrl = 'https://jvhbqfueutvfepsjmztx.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🔧 DIAGNOSTIC CHECKS:');
  console.log('');
  
  try {
    // Test 1: Service role key permissions
    console.log('1. Testing service role key permissions...');
    try {
      const { data: users, error } = await supabase.auth.admin.listUsers();
      if (error) {
        console.log(`   ❌ Service role error: ${error.message}`);
        console.log('   🔑 Issue: Service role key may be incorrect or expired');
      } else {
        console.log(`   ✅ Service role key working - ${users.users.length} users found`);
      }
    } catch (error) {
      console.log(`   ❌ Service role exception: ${error.message}`);
    }
    console.log('');
    
    // Test 2: Direct auth user creation test
    console.log('2. Testing direct user creation with service role...');
    const testEmail = `direct-test-${Date.now()}@test.com`;
    const testPassword = 'TestPass123!';
    
    try {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: false,
        user_metadata: {
          first_name: 'Test',
          last_name: 'User',
          phone: '1234567890',
          account_type: 'customer'
        }
      });
      
      if (createError) {
        console.log(`   ❌ Direct creation failed: ${createError.message}`);
        console.log(`   🔍 Error details:`, JSON.stringify(createError, null, 2));
        
        if (createError.message.includes('User not allowed')) {
          console.log('   🎯 ROOT CAUSE FOUND: "User not allowed" in direct creation');
          console.log('   📋 POSSIBLE CAUSES:');
          console.log('      • Supabase Auth email confirmation required');
          console.log('      • Auth provider restrictions');
          console.log('      • Email domain blacklist');
          console.log('      • Supabase project settings');
        }
      } else {
        console.log(`   ✅ Direct creation successful: ${newUser.user.id}`);
        
        // Clean up test user
        try {
          await supabase.auth.admin.deleteUser(newUser.user.id);
          console.log('   🧹 Test user cleaned up');
        } catch (cleanupError) {
          console.log('   ⚠️  Test user cleanup failed');
        }
      }
    } catch (error) {
      console.log(`   ❌ Direct creation exception: ${error.message}`);
    }
    console.log('');
    
    // Test 3: Check customers table RLS policies
    console.log('3. Testing customers table access...');
    try {
      const { data: customerTest, error: customerError } = await supabase
        .from('customers')
        .select('count')
        .limit(1);
      
      if (customerError) {
        console.log(`   ❌ Customers table error: ${customerError.message}`);
        console.log('   🔑 Issue: RLS policies may be blocking service role');
      } else {
        console.log('   ✅ Customers table accessible');
      }
    } catch (error) {
      console.log(`   ❌ Customers table exception: ${error.message}`);
    }
    console.log('');
    
    // Test 4: Check if issue is domain-specific
    console.log('4. Testing different email domains...');
    const testDomains = ['@gmail.com', '@test.com', '@example.org'];
    
    for (const domain of testDomains) {
      const domainEmail = `test${Date.now()}${domain}`;
      try {
        const { data: domainUser, error: domainError } = await supabase.auth.admin.createUser({
          email: domainEmail,
          password: 'TestPass123!',
          email_confirm: false
        });
        
        if (domainError) {
          console.log(`   ❌ ${domain}: ${domainError.message}`);
        } else {
          console.log(`   ✅ ${domain}: Creation successful`);
          // Clean up
          await supabase.auth.admin.deleteUser(domainUser.user.id);
        }
      } catch (error) {
        console.log(`   ❌ ${domain}: Exception - ${error.message}`);
      }
    }
    console.log('');
    
    // Test 5: Check Supabase project auth settings
    console.log('5. Checking auth configuration...');
    try {
      // Try to get current auth configuration
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      console.log(`   Supabase API response: ${response.status}`);
      
      if (response.status === 401) {
        console.log('   ❌ API key authentication failed');
      } else if (response.status === 200) {
        console.log('   ✅ API key authentication successful');
      }
      
    } catch (error) {
      console.log(`   ⚠️  Auth config check failed: ${error.message}`);
    }
    console.log('');
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error.message);
  }
  
  console.log('='.repeat(70));
  console.log('🎯 LIKELY SOLUTIONS TO TRY:');
  console.log('');
  console.log('1. 📧 EMAIL CONFIRMATION SETTINGS:');
  console.log('   • Check if Supabase requires email confirmation');
  console.log('   • Try setting email_confirm: true in createUser');
  console.log('');
  console.log('2. 🔑 AUTH PROVIDER SETTINGS:');
  console.log('   • Verify email provider is enabled in Supabase dashboard');
  console.log('   • Check if custom SMTP is properly configured');
  console.log('');
  console.log('3. 🛡️  SECURITY POLICIES:');
  console.log('   • Review RLS policies on auth.users (if any)');
  console.log('   • Check project-level auth restrictions');
  console.log('');
  console.log('4. 🔧 CONFIGURATION FIXES:');
  console.log('   • Use anon key instead of service role for user creation');
  console.log('   • Implement signUp instead of admin.createUser');
  console.log('');
  
  console.log('='.repeat(70));
  console.log('🚀 REGISTRATION ERROR DIAGNOSIS: COMPLETE');
  console.log('='.repeat(70));
}

diagnoseRegistrationError().catch(console.error);