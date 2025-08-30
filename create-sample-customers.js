const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createSampleCustomers() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🚀 Creating sample customer data...');

  const sampleCustomers = [
    {
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@example.com',
      phone: '(555) 123-4567',
      company_name: 'Smith Plumbing LLC',
      address_line1: '123 Main Street',
      city: 'Austin',
      state: 'TX',
      zip_code: '78701',
      account_number: 'FB-001234',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'email'
    },
    {
      first_name: 'Maria',
      last_name: 'Garcia',
      email: 'maria.garcia@cityrestaurant.com',
      phone: '(555) 234-5678',
      company_name: 'City Restaurant Group',
      address_line1: '456 Oak Avenue',
      city: 'Austin',
      state: 'TX',
      zip_code: '78702',
      account_number: 'FB-001235',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'phone'
    },
    {
      first_name: 'Robert',
      last_name: 'Johnson',
      email: 'rjohnson@techoffice.com',
      phone: '(555) 345-6789',
      company_name: 'Tech Office Building',
      address_line1: '789 Business Blvd',
      address_line2: 'Suite 200',
      city: 'Austin',
      state: 'TX',
      zip_code: '78703',
      account_number: 'FB-001236',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'email'
    },
    {
      first_name: 'Lisa',
      last_name: 'Chen',
      email: 'lisa@healthclinic.org',
      phone: '(555) 456-7890',
      company_name: 'Downtown Health Clinic',
      address_line1: '321 Medical Center Dr',
      city: 'Austin',
      state: 'TX',
      zip_code: '78704',
      account_number: 'FB-001237',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'email'
    },
    {
      first_name: 'David',
      last_name: 'Williams',
      email: 'dwilliams@apartmentcomplex.com',
      phone: '(555) 567-8901',
      company_name: 'Sunset Apartments',
      address_line1: '654 Residential Way',
      city: 'Austin',
      state: 'TX',
      zip_code: '78705',
      account_number: 'FB-001238',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'phone'
    }
  ];

  try {
    // Check current count
    const { data: existingCustomers, error: countError } = await supabase
      .from('customers')
      .select('id');
    
    if (countError) {
      console.log('❌ Error checking existing customers:', countError.message);
      return;
    }

    console.log(`📊 Current customer count: ${existingCustomers?.length || 0}`);

    // Insert sample customers
    const { data: newCustomers, error: insertError } = await supabase
      .from('customers')
      .insert(sampleCustomers)
      .select();

    if (insertError) {
      console.log('❌ Error inserting customers:', insertError.message);
      return;
    }

    console.log(`✅ Successfully added ${newCustomers?.length || 0} sample customers`);
    
    // Verify total count
    const { data: allCustomers, error: finalCountError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, company_name');
    
    if (finalCountError) {
      console.log('❌ Error getting final count:', finalCountError.message);
      return;
    }

    console.log(`🎯 Total customers now: ${allCustomers?.length || 0}`);
    
    if (allCustomers && allCustomers.length > 0) {
      console.log('\n📋 Customer List:');
      allCustomers.forEach((customer, index) => {
        console.log(`   ${index + 1}. ${customer.first_name} ${customer.last_name} - ${customer.company_name}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createSampleCustomers();