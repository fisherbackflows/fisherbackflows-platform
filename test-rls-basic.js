#!/usr/bin/env node

// Test basic RLS enforcement
require('dotenv').config({ path: '.env.local' });

async function testBasicRLS() {
  console.log('🧪 TESTING BASIC RLS ENFORCEMENT\n');

  try {
    const { createClient } = await import('@supabase/supabase-js');

    // Test with anon key (should be blocked by RLS)
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    console.log('🔍 Testing test_rls table with anon key (should be blocked):');

    const { data, error } = await anonSupabase
      .from('test_rls')
      .select('*');

    if (error) {
      console.log('✅ RLS IS WORKING! Access blocked:', error.message);
      console.log('🎉 This means RLS is functional in your project');
    } else {
      console.log('❌ RLS NOT WORKING! Access allowed, data:', data);
      console.log('🚨 This indicates RLS is not functioning properly');
    }

    // Also test one of the main tables for comparison
    console.log('\n🔍 Testing billing_invoices with anon key:');

    const { data: invoiceData, error: invoiceError } = await anonSupabase
      .from('billing_invoices')
      .select('*');

    if (invoiceError) {
      console.log('✅ billing_invoices: Access blocked:', invoiceError.message);
    } else {
      console.log('❌ billing_invoices: Access allowed, data:', invoiceData);
    }

    console.log('\n📋 DIAGNOSIS:');
    if (error && !invoiceError) {
      console.log('🔍 RLS works on test table but not on main tables');
      console.log('💡 Main tables may have conflicting policies or configurations');
    } else if (error && invoiceError) {
      console.log('✅ RLS is working correctly on both tables');
      console.log('🎉 The original test script may have an issue');
    } else if (!error && !invoiceError) {
      console.log('❌ RLS is not working on any tables');
      console.log('🚨 Fundamental RLS configuration issue');
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testBasicRLS().catch(console.error);