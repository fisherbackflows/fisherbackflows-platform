#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestCompanySettings() {
  console.log('🔧 Creating company_settings record for test company...\n');

  try {
    const companyId = 'bd6958c0-a8a4-4b15-93d5-12c0b56732d4';

    const { data, error } = await supabase
      .from('company_settings')
      .upsert({
        company_id: companyId,
        default_test_price: 150.00,
        default_retest_price: 75.00,
        default_emergency_price: 250.00,
        primary_color: '#0ea5e9',
        secondary_color: '#1e293b',
        show_branding: true
      }, {
        onConflict: 'company_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating settings:', error);
    } else {
      console.log('✅ Company settings created successfully!');
      console.log(`   Company ID: ${data.company_id}`);
      console.log(`   Primary Color: ${data.primary_color}`);
      console.log(`   Test Price: $${data.default_test_price}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

createTestCompanySettings();