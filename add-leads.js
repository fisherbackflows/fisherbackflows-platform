const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jvhbqfueutvfepsjmztx.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addLeads() {
  console.log('🚀 Adding leads to database...');

  try {
    const leads = [
      {
        first_name: 'David',
        last_name: 'Wilson',
        email: 'david.wilson@example.com',
        phone: '(253) 555-0201',
        company_name: 'Wilson Enterprises',
        address: '321 Main St',
        city: 'Tacoma',
        state: 'WA',
        zip_code: '98405',
        source: 'website',
        lead_type: 'test_inquiry',
        status: 'new',
        estimated_value: 350.00,
        message: 'Need annual backflow testing for commercial property'
      },
      {
        first_name: 'Lisa',
        last_name: 'Brown',
        email: 'lisa.brown@company.com', 
        phone: '(253) 555-0202',
        company_name: 'Brown Corp',
        address: '654 Oak Ave',
        city: 'Seattle',
        state: 'WA', 
        zip_code: '98102',
        source: 'referral',
        lead_type: 'new_installation',
        status: 'contacted',
        estimated_value: 1200.00,
        message: 'Installing new backflow prevention system'
      },
      {
        first_name: 'Robert',
        last_name: 'Taylor',
        email: 'robert.taylor@business.com',
        phone: '(253) 555-0203',
        company_name: 'Taylor Industries',
        address: '987 Pine St',
        city: 'Spokane',
        state: 'WA',
        zip_code: '99202', 
        source: 'google',
        lead_type: 'test_inquiry',
        status: 'qualified',
        estimated_value: 275.00,
        message: 'Annual testing required by city'
      },
      {
        first_name: 'Jennifer',
        last_name: 'Martinez',
        email: 'jennifer.martinez@corp.com',
        phone: '(253) 555-0204',
        company_name: 'Martinez Corp',
        address: '147 Elm St',
        city: 'Tacoma',
        state: 'WA',
        zip_code: '98406',
        source: 'referral',
        lead_type: 'repair', 
        status: 'converted',
        estimated_value: 800.00,
        message: 'Backflow preventer needs repair'
      },
      {
        first_name: 'Michael',
        last_name: 'Johnson',
        email: 'michael.johnson@biz.com',
        phone: '(253) 555-0205', 
        company_name: 'Johnson LLC',
        address: '258 Cedar Ave',
        city: 'Tacoma',
        state: 'WA',
        zip_code: '98407',
        source: 'facebook',
        lead_type: 'quote_request',
        status: 'new',
        estimated_value: 425.00,
        message: 'Looking for quote on backflow testing services'
      }
    ];

    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .insert(leads)
      .select();
    
    if (leadsError) {
      console.error('❌ Error adding leads:', leadsError);
    } else {
      console.log('✅ Added', leadsData.length, 'leads successfully!');
      console.log('📊 Lead statuses:');
      leadsData.forEach(lead => {
        console.log(`   • ${lead.first_name} ${lead.last_name} - ${lead.status} - $${lead.estimated_value}`);
      });
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

addLeads();