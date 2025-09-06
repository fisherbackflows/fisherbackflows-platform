const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const realLeads = [
  {
    first_name: 'John',
    last_name: 'Anderson',
    company_name: 'Pacific Properties LLC',
    email: 'manager@pacificproperties.com',
    phone: '(253) 555-8901',
    address: '1234 Pacific Ave',
    city: 'Tacoma',
    state: 'WA',
    zip_code: '98402',
    source: 'website',
    lead_type: 'test_inquiry',
    urgency: 'high',
    estimated_value: 500,
    message: 'Multi-unit commercial building, needs annual compliance testing for 4 devices',
    status: 'new'
  },
  {
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sjohnson@email.com',
    phone: '(253) 555-2345',
    address: '5678 Oak Street',
    city: 'Lakewood',
    state: 'WA',
    zip_code: '98499',
    source: 'referral',
    lead_type: 'test_inquiry',
    urgency: 'normal',
    estimated_value: 75,
    message: 'Referred by neighbor, single family home',
    status: 'new'
  },
  {
    first_name: 'Mike',
    last_name: 'Thompson',
    company_name: 'Tacoma Bay Restaurant Group',
    email: 'operations@tacomabayrestaurants.com',
    phone: '(253) 555-7890',
    address: '910 Waterfront Way',
    city: 'Tacoma',
    state: 'WA', 
    zip_code: '98401',
    source: 'phone',
    lead_type: 'test_inquiry',
    urgency: 'urgent',
    estimated_value: 375,
    message: 'Restaurant chain with 3 locations, urgent compliance deadline',
    status: 'contacted'
  },
  {
    first_name: 'Linda',
    last_name: 'Davis',
    company_name: 'Green Valley Apartments',
    email: 'management@greenvalleyapts.com',
    phone: '(253) 555-3456',
    address: '2200 Valley Road',
    city: 'Puyallup',
    state: 'WA',
    zip_code: '98371',
    source: 'google',
    lead_type: 'quote_request',
    urgency: 'high',
    estimated_value: 800,
    message: '120-unit apartment complex, requires comprehensive testing',
    status: 'new'
  },
  {
    first_name: 'Robert',
    last_name: 'Chen',
    email: 'rchen@gmail.com',
    phone: '(253) 555-6789',
    address: '3456 Maple Drive',
    city: 'Federal Way',
    state: 'WA',
    zip_code: '98003',
    source: 'website',
    lead_type: 'test_inquiry',
    urgency: 'normal',
    estimated_value: 75,
    message: 'New homeowner, needs initial testing',
    status: 'converted'
  },
  {
    first_name: 'David',
    last_name: 'Martinez',
    company_name: 'Westside Medical Center',
    email: 'facilities@westsidemedical.com',
    phone: '(253) 555-0123',
    address: '7890 Medical Center Blvd',
    city: 'Tacoma',
    state: 'WA',
    zip_code: '98409',
    source: 'referral',
    lead_type: 'test_inquiry',
    urgency: 'urgent',
    estimated_value: 1200,
    message: 'Medical facility with multiple buildings, critical compliance requirements',
    status: 'contacted'
  },
  {
    first_name: 'Maria',
    last_name: 'Rodriguez',
    email: 'mrodriguez@outlook.com',
    phone: '(253) 555-4567',
    address: '1122 Pine Street',
    city: 'Des Moines',
    state: 'WA',
    zip_code: '98198',
    source: 'website',
    lead_type: 'test_inquiry',
    urgency: 'normal',
    estimated_value: 75,
    message: 'Duplex property owner',
    status: 'new'
  },
  {
    first_name: 'James',
    last_name: 'Wilson',
    company_name: 'Harbor View Shopping Center',
    email: 'admin@harborviewsc.com',
    phone: '(253) 555-8765',
    address: '4500 Harbor View Dr',
    city: 'Gig Harbor',
    state: 'WA',
    zip_code: '98335',
    source: 'email',
    lead_type: 'quote_request',
    urgency: 'high',
    estimated_value: 600,
    message: 'Shopping center with 8 retail units',
    status: 'new'
  }
];

async function seedLeads() {
  try {
    console.log('Starting to seed leads...');
    
    // First, check if leads already exist
    const { data: existingLeads, error: checkError } = await supabase
      .from('leads')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.error('Error checking leads table:', checkError);
      return;
    }
    
    if (existingLeads && existingLeads.length > 0) {
      console.log('Leads already exist in database. Skipping seed.');
      
      // Get count
      const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });
      
      console.log(`Current lead count: ${count}`);
      return;
    }
    
    // Insert leads with created_at timestamps
    const leadsWithTimestamps = realLeads.map((lead, index) => ({
      ...lead,
      created_at: new Date(Date.now() - (index * 86400000)).toISOString() // Stagger creation dates
    }));
    
    const { data, error } = await supabase
      .from('leads')
      .insert(leadsWithTimestamps)
      .select();
    
    if (error) {
      console.error('Error inserting leads:', error);
      return;
    }
    
    console.log(`Successfully inserted ${data.length} leads`);
    console.log('Sample lead:', data[0]);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  } finally {
    process.exit();
  }
}

seedLeads();