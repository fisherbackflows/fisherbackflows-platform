#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkCompanyColumns() {
  console.log('🔍 Checking companies table columns...\n');

  // Test basic select
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, email')
      .limit(1);

    if (error) {
      console.error('❌ Basic select error:', error);
    } else {
      console.log('✅ Basic select works');
    }
  } catch (err) {
    console.error('❌ Basic select exception:', err.message);
  }

  // Test with address_line1
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('address_line1')
      .limit(1);

    if (error) {
      console.error('❌ Address line1 error:', error);
    } else {
      console.log('✅ address_line1 column exists and accessible');
    }
  } catch (err) {
    console.error('❌ Address line1 exception:', err.message);
  }

  // Try inserting a minimal company record
  try {
    console.log('\n🧪 Testing company insert...');
    const { data, error } = await supabase
      .from('companies')
      .insert({
        name: 'Test Schema Company',
        email: 'test@schema.com',
        slug: 'test-schema-company'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Insert error:', error);
    } else {
      console.log('✅ Company insert successful:', data.id);

      // Clean up
      await supabase
        .from('companies')
        .delete()
        .eq('id', data.id);
      console.log('✅ Test record cleaned up');
    }
  } catch (err) {
    console.error('❌ Insert exception:', err.message);
  }

  // Try insert with address fields
  try {
    console.log('\n🏠 Testing company insert with address...');
    const { data, error } = await supabase
      .from('companies')
      .insert({
        name: 'Test Address Company',
        email: 'test@address.com',
        slug: 'test-address-company',
        address_line1: '123 Test Street',
        city: 'Test City',
        state: 'WA'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Address insert error:', error);
      if (error.code === 'PGRST204') {
        console.log('\n💡 Schema cache issue detected!');
        console.log('Solution: The database has the columns but PostgREST cache needs refresh.');
        console.log('This usually happens after schema changes.');
      }
    } else {
      console.log('✅ Company with address insert successful:', data.id);

      // Clean up
      await supabase
        .from('companies')
        .delete()
        .eq('id', data.id);
      console.log('✅ Test record cleaned up');
    }
  } catch (err) {
    console.error('❌ Address insert exception:', err.message);
  }
}

checkCompanyColumns();