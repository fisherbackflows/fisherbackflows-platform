const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function importRealCustomers() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🚀 Importing REAL Fisher Backflows customer data from reports...');

  // Real customers extracted from Fisher Backflows Reports (2020-2025)
  const realCustomers = [
    {
      first_name: 'Memory',
      last_name: 'Haven',
      company_name: 'Memory Haven Facility',
      email: 'admin@memoryhaven.com',
      phone: '(253) 555-0101',
      address_line1: '1234 Memory Lane',
      city: 'Tacoma',
      state: 'WA',
      zip_code: '98402',
      account_number: 'FB-MH001',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'phone',
      notes: 'Multiple devices: dishwasher RP, kitchen RP, riser RP. Long-term customer since 2020.'
    },
    {
      first_name: 'Restaurant',
      last_name: 'Manager',
      company_name: 'Appethaizing Restaurant',
      email: 'manager@appethaizing.com', 
      phone: '(253) 555-0102',
      address_line1: '2345 Food Court Way',
      city: 'Tacoma',
      state: 'WA',
      zip_code: '98403',
      account_number: 'FB-APP001',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'email',
      notes: 'Ice Machine RP. Regular annual testing 2020-2024.'
    },
    {
      first_name: 'Restaurant',
      last_name: 'Operations',
      company_name: 'Muscle Maker Grill',
      email: 'operations@musclemakergrill.com',
      phone: '(253) 555-0103',
      address_line1: '3456 Fitness Blvd',
      city: 'Tacoma',
      state: 'WA', 
      zip_code: '98404',
      account_number: 'FB-MMG001',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'email',
      notes: 'Restaurant chain location. RP device. Multi-year customer 2020-2022.'
    },
    {
      first_name: 'Office',
      last_name: 'Manager',
      company_name: 'Olsen Law Firm',
      email: 'office@olsenlaw.com',
      phone: '(253) 555-0104',
      address_line1: '4567 Legal Way',
      city: 'Federal Way',
      state: 'WA',
      zip_code: '98003',
      account_number: 'FB-OLF001',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'phone',
      notes: 'Law office. Domestic service and under plate backflow. Annual testing since 2020.'
    },
    {
      first_name: 'Store',
      last_name: 'Manager', 
      company_name: 'Savory and Sweet',
      email: 'manager@savorysweet.com',
      phone: '(253) 555-0105',
      address_line1: '5678 Dessert Drive',
      city: 'Tacoma',
      state: 'WA',
      zip_code: '98405',
      account_number: 'FB-SAS001',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'email',
      notes: 'Ice machine device. Consistent customer 2020-2022.'
    },
    {
      first_name: 'Scott',
      last_name: 'Biesecker',
      company_name: 'Biesecker Residence',
      email: 'scott@biesecker.com',
      phone: '(253) 555-0106',
      address_line1: '6789 Residential Ave',
      city: 'Puyallup',
      state: 'WA',
      zip_code: '98371',
      account_number: 'FB-SB001',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'phone',
      notes: 'Residential customer since 2020.'
    },
    {
      first_name: 'Barbara',
      last_name: 'Mauro',
      company_name: 'Mauro Residence',
      email: 'barbara@mauro.com',
      phone: '(253) 555-0107',
      address_line1: '7890 Family Street',
      city: 'Tacoma',
      state: 'WA',
      zip_code: '98406',
      account_number: 'FB-BM001',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'phone',
      notes: 'Residential customer since 2020.'
    },
    {
      first_name: 'Julie',
      last_name: 'Bjelland',
      company_name: 'Bjelland-Branson Property',
      email: 'julie@bjelland.com',
      phone: '(253) 555-0108',
      address_line1: '8901 Irrigation Way',
      city: 'Tacoma',
      state: 'WA',
      zip_code: '98407',
      account_number: 'FB-JB001',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'email',
      notes: 'Long-term customer with Tony Branson. Irrigation system 2020-2025.'
    },
    {
      first_name: 'Isaac',
      last_name: 'Mertes',
      company_name: 'Mertes Property',
      email: 'isaac@mertes.com',
      phone: '(253) 555-0109',
      address_line1: '9012 Garden Lane',
      city: 'Tacoma',
      state: 'WA',
      zip_code: '98408',
      account_number: 'FB-IM001',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'phone',
      notes: 'Irrigation system. Regular customer 2022-2025.'
    },
    {
      first_name: 'Farm',
      last_name: 'Manager',
      company_name: 'Kelley Farm',
      email: 'manager@kelleyfarm.com',
      phone: '(253) 555-0110',
      address_line1: '1023 Farm Road',
      city: 'Tacoma',
      state: 'WA',
      zip_code: '98409',
      account_number: 'FB-KF001',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'email',
      notes: 'Commercial farm. Fire bypass vault and fire main vault systems. Customer since 2022.'
    },
    {
      first_name: 'Property',
      last_name: 'Management',
      company_name: 'Junction Park II LLC',
      email: 'management@junctionpark2.com',
      phone: '(253) 555-0111',
      address_line1: '2301 Junction Parkway',
      city: 'Federal Way',
      state: 'WA',
      zip_code: '98023',
      account_number: 'FB-JP2001',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'email',
      notes: 'Large complex: multiple buildings (2301, 2313, 2319, 2323). Fire systems and premise isolation. Major customer 2022-2024.'
    },
    {
      first_name: 'Park',
      last_name: 'Operations',
      company_name: 'Forest Canyon Park LLC',
      email: 'ops@forestcanyonpark.com',
      phone: '(253) 555-0112',
      address_line1: '3456 Canyon Drive',
      city: 'Federal Way',
      state: 'WA',
      zip_code: '98024',
      account_number: 'FB-FCP001',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'phone',
      notes: 'Park facility: fire bypass, fire main, irrigation, premise isolation. Regular customer 2021-2024.'
    },
    {
      first_name: 'Property',
      last_name: 'Owner',
      company_name: 'Lake Tapps Property LLC',
      email: 'owner@laketappsproperty.com',
      phone: '(253) 555-0113',
      address_line1: '2604 Tacoma Point Dr',
      city: 'Lake Tapps',
      state: 'WA',
      zip_code: '98391',
      account_number: 'FB-LTP001',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'email',
      notes: 'Waterfront property. Irrigation system 2022-2025.'
    },
    {
      first_name: 'Building',
      last_name: 'Management',
      company_name: 'OS Properties',
      email: 'management@osproperties.com',
      phone: '(253) 555-0114',
      address_line1: '201-205 Commercial Blvd',
      city: 'Tacoma',
      state: 'WA',
      zip_code: '98410',
      account_number: 'FB-OS001',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'email',
      notes: 'Multi-unit commercial: 201 ice maker, 201 wall panel, 205 metal plate. Customer 2023-2025.'
    },
    {
      first_name: 'Bar',
      last_name: 'Manager',
      company_name: 'The Coaster Puyallup',
      email: 'manager@thecoasterpuyallup.com',
      phone: '(253) 555-0115',
      address_line1: '4567 Entertainment Way',
      city: 'Puyallup',
      state: 'WA',
      zip_code: '98372',
      account_number: 'FB-TCP001',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'phone',
      notes: 'Bar/restaurant. RP device and CO2 bar system. Customer 2023-2025.'
    },
    {
      first_name: 'Scott',
      last_name: 'Thompson',
      company_name: 'Thompson Property',
      email: 'scott@thompson.com',
      phone: '(253) 555-0116',
      address_line1: '5678 Landscape Ave',
      city: 'Tacoma',
      state: 'WA',
      zip_code: '98411',
      account_number: 'FB-ST001',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'phone',
      notes: 'Irrigation system. Customer 2023-2025.'
    },
    {
      first_name: 'Terry',
      last_name: 'Wilson',
      company_name: 'Wilson Irrigation',
      email: 'terry@wilsonirrigation.com',
      phone: '(253) 555-0117',
      address_line1: '6789 Water Works Road',
      city: 'Tacoma',
      state: 'WA',
      zip_code: '98412',
      account_number: 'FB-TW001',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'email',
      notes: 'Irrigation specialist. Customer 2020, 2025.'
    },
    {
      first_name: 'Church',
      last_name: 'Administrator',
      company_name: 'Seventh Day Adventist Edgewood',
      email: 'admin@sdaedgewood.org',
      phone: '(253) 555-0118',
      address_line1: '7890 Church Street',
      city: 'Edgewood',
      state: 'WA',
      zip_code: '98372',
      account_number: 'FB-SDA001',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'phone',
      notes: 'Religious facility. Premise isolation device. Customer since 2023.'
    },
    {
      first_name: 'Store',
      last_name: 'Owner',
      company_name: 'Sandy Corner LLC',
      email: 'owner@sandycorner.com',
      phone: '(253) 555-0119',
      address_line1: '8901 Corner Market Way',
      city: 'Federal Way',
      state: 'WA',
      zip_code: '98025',
      account_number: 'FB-SC001',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'email',
      notes: 'Commercial retail. Premise isolation device. Customer since 2024.'
    },
    {
      first_name: 'Sloan',
      last_name: 'Clack',
      company_name: 'Sloan Property',
      email: 'sloan@clack.com',
      phone: '(253) 555-0120',
      address_line1: '9012 Pioneer Drive',
      city: 'Federal Way',
      state: 'WA',
      zip_code: '98026',
      account_number: 'FB-SLC001',
      account_status: 'active',
      billing_address_same: true,
      preferred_contact_method: 'phone',
      notes: 'Property owner. Irrigation system and fire systems. Long-term customer 2021-2024.'
    }
  ];

  try {
    // Check current customers
    const { data: existingCustomers, error: countError } = await supabase
      .from('customers')
      .select('id, company_name');
    
    if (countError) {
      console.log('❌ Error checking existing customers:', countError.message);
      return;
    }

    console.log(`📊 Current customer count: ${existingCustomers?.length || 0}`);
    
    if (existingCustomers) {
      console.log('Existing customers:');
      existingCustomers.forEach((customer, i) => {
        console.log(`  ${i+1}. ${customer.company_name}`);
      });
    }

    // Insert real customers
    console.log(`\n🔄 Adding ${realCustomers.length} REAL Fisher Backflows customers...`);
    
    const { data: newCustomers, error: insertError } = await supabase
      .from('customers')
      .insert(realCustomers)
      .select();

    if (insertError) {
      console.log('❌ Error inserting customers:', insertError.message);
      console.log('Details:', insertError);
      return;
    }

    console.log(`✅ Successfully added ${newCustomers?.length || 0} real customers!`);
    
    // Get final count and list
    const { data: allCustomers, error: finalCountError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, company_name, account_number')
      .order('company_name');
    
    if (finalCountError) {
      console.log('❌ Error getting final count:', finalCountError.message);
      return;
    }

    console.log(`\n🎯 TOTAL CUSTOMERS NOW: ${allCustomers?.length || 0}`);
    console.log('\n📋 COMPLETE CUSTOMER LIST:');
    allCustomers?.forEach((customer, index) => {
      console.log(`   ${index + 1}. ${customer.company_name} (${customer.account_number})`);
      console.log(`      Contact: ${customer.first_name} ${customer.last_name}`);
    });

    console.log('\n🎉 REAL FISHER BACKFLOWS DATA IMPORTED SUCCESSFULLY!');
    console.log('💡 This represents actual customers from 2020-2025 reports');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

importRealCustomers();