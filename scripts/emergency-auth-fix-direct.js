#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function emergencyAuthFix() {
  console.log('🚨 EMERGENCY AUTHENTICATION FIX');
  console.log('This script will test access and provide manual fix instructions\n');

  try {
    const supabase = createClient(
      'https://jvhbqfueutvfepsjmztx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY'
    );

    // Test 1: Check if service role can access customers table
    console.log('🔍 Step 1: Testing service role access to customers table...');
    
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name')
      .limit(1);

    if (customersError) {
      console.log('❌ SERVICE ROLE BLOCKED - This confirms the RLS issue');
      console.log(`   Error: ${customersError.message}`);
      console.log(`   Code: ${customersError.code}`);
      
      if (customersError.message.includes('Row Level Security')) {
        console.log('\n🎯 CONFIRMED: RLS policies are blocking service role access');
        console.log('This is exactly why login is failing!');
      }
    } else {
      console.log('✅ Service role can access customers table');
      console.log(`   Found ${customers?.length || 0} customer records`);
    }

    // Test 2: Check current RLS policies
    console.log('\n🔍 Step 2: Checking current RLS policies on customers table...');
    
    const { data: policies, error: policyError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            roles,
            cmd,
            CASE 
              WHEN roles @> ARRAY['service_role'] THEN 'ALLOWS SERVICE ROLE'
              ELSE 'BLOCKS SERVICE ROLE'
            END as service_role_access
          FROM pg_policies 
          WHERE tablename = 'customers'
          ORDER BY policyname;
        `
      });

    if (policyError && !policyError.message.includes('Could not find the function')) {
      console.log(`⚠️  Could not check policies: ${policyError.message}`);
    } else if (policies && Array.isArray(policies)) {
      console.log('📋 Current RLS policies on customers table:');
      if (policies.length === 0) {
        console.log('   • No RLS policies found');
      } else {
        policies.forEach(policy => {
          console.log(`   • ${policy.policyname} (${policy.cmd})`);
          console.log(`     Roles: ${policy.roles || 'N/A'}`);
          console.log(`     Service Role Access: ${policy.service_role_access}`);
        });
      }
    }

    // Test 3: Check if we can query auth.users
    console.log('\n🔍 Step 3: Testing access to auth.users table...');
    
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email')
      .limit(1);

    if (authError) {
      console.log(`   ⚠️  Cannot access auth.users: ${authError.message}`);
    } else {
      console.log(`   ✅ Can access auth.users (${authUsers?.length || 0} records)`);
    }

    // Provide the manual fix
    console.log('\n🔧 MANUAL FIX REQUIRED');
    console.log('Since automated policy updates are not working, please execute this SQL manually:');
    console.log('\n📋 Go to Supabase Dashboard → SQL Editor and execute:');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log('-- CRITICAL FIX: Remove restrictive RLS policies blocking service role');
    console.log('DROP POLICY IF EXISTS "customers_select" ON customers;');
    console.log('DROP POLICY IF EXISTS "customers_insert" ON customers;');
    console.log('DROP POLICY IF EXISTS "customers_update" ON customers;');
    console.log('DROP POLICY IF EXISTS "customers_delete" ON customers;');
    console.log('');
    console.log('-- Create service role policy (HIGHEST PRIORITY)');
    console.log('CREATE POLICY "service_role_full_access" ON customers');
    console.log('    FOR ALL TO service_role');
    console.log('    USING (true)');
    console.log('    WITH CHECK (true);');
    console.log('');
    console.log('-- Create user access policy for authenticated users');
    console.log('CREATE POLICY "users_own_data" ON customers');
    console.log('    FOR ALL TO authenticated');
    console.log('    USING (auth.uid()::text = id::text)');
    console.log('    WITH CHECK (auth.uid()::text = id::text);');
    console.log('─────────────────────────────────────────────────────────────────');

    // Test registration and login after manual fix
    console.log('\n🧪 After applying the manual fix, test these endpoints:');
    console.log('1. Registration: curl -X POST http://localhost:3010/api/auth/register -H "Content-Type: application/json" -d \'{"email":"test2@example.com","password":"testpass123","firstName":"Test2","lastName":"User","phone":"555-123-4567","addressLine1":"123 Test St","city":"Seattle","state":"WA","zipCode":"98101"}\'');
    console.log('2. Login: curl -X POST http://localhost:3010/api/auth/login -H "Content-Type: application/json" -d \'{"email":"test2@example.com","password":"testpass123"}\'');

    return true;

  } catch (error) {
    console.error('💥 Script failed:', error.message);
    return false;
  }
}

emergencyAuthFix();