const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jvhbqfueutvfepsjmztx.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3NTAzMzQsImV4cCI6MjA0NjMyNjMzNH0.SbU3suNwyoJsq_6cJQPFUi2-P5hIf1z5KJ0YkQOx5-A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateTestData() {
  console.log('🚀 Starting to populate test data...');

  try {
    // 1. Add sample customers
    console.log('📱 Adding customers...');
    const customers = [
      {
        email: 'john.smith@company1.com',
        first_name: 'John',
        last_name: 'Smith', 
        company_name: 'Smith Industries',
        phone: '(253) 555-0101',
        address_line1: '123 Business Ave',
        city: 'Tacoma',
        state: 'WA',
        zip_code: '98402'
      },
      {
        email: 'sarah.johnson@company2.com',
        first_name: 'Sarah',
        last_name: 'Johnson',
        company_name: 'Johnson Manufacturing', 
        phone: '(253) 555-0102',
        address_line1: '456 Industrial Blvd',
        city: 'Seattle',
        state: 'WA',
        zip_code: '98101'
      },
      {
        email: 'mike.davis@company3.com',
        first_name: 'Mike',
        last_name: 'Davis',
        company_name: 'Davis Construction',
        phone: '(253) 555-0103', 
        address_line1: '789 Commerce St',
        city: 'Spokane',
        state: 'WA',
        zip_code: '99201'
      }
    ];

    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .insert(customers)
      .select();
    
    if (customersError) {
      console.error('❌ Error adding customers:', customersError);
    } else {
      console.log('✅ Added', customersData.length, 'customers');
    }

    // 2. Add sample leads
    console.log('📈 Adding leads...');
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
      }
    ];

    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .insert(leads)
      .select();
    
    if (leadsError) {
      console.error('❌ Error adding leads:', leadsError);
    } else {
      console.log('✅ Added', leadsData.length, 'leads');
    }

    // 3. Add sample invoices for revenue
    console.log('💰 Adding invoices...');
    const invoices = [
      {
        customer_id: customersData?.[0]?.id,
        invoice_number: 'INV-2024-001',
        invoice_date: '2024-01-15',
        due_date: '2024-02-15',
        subtotal: 350.00,
        tax_rate: 0.0875,
        tax_amount: 30.63,
        total_amount: 380.63,
        amount_paid: 380.63,
        status: 'paid',
        payment_status: 'paid',
        description: 'Annual backflow testing service',
        paid_date: '2024-01-20'
      },
      {
        customer_id: customersData?.[1]?.id,
        invoice_number: 'INV-2024-002', 
        invoice_date: '2024-02-10',
        due_date: '2024-03-10',
        subtotal: 1200.00,
        tax_rate: 0.0875,
        tax_amount: 105.00,
        total_amount: 1305.00,
        amount_paid: 1305.00,
        status: 'paid',
        payment_status: 'paid',
        description: 'New backflow preventer installation',
        paid_date: '2024-02-15'
      },
      {
        customer_id: customersData?.[2]?.id,
        invoice_number: 'INV-2024-003',
        invoice_date: '2024-11-01',
        due_date: '2024-12-01', 
        subtotal: 275.00,
        tax_rate: 0.0875,
        tax_amount: 24.06,
        total_amount: 299.06,
        amount_paid: 0,
        status: 'sent',
        payment_status: 'unpaid',
        description: 'Annual backflow testing'
      }
    ];

    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .insert(invoices)
      .select();
    
    if (invoicesError) {
      console.error('❌ Error adding invoices:', invoicesError);
    } else {
      console.log('✅ Added', invoicesData.length, 'invoices');
    }

    // 4. Add sample payments
    console.log('💳 Adding payments...');
    const payments = [
      {
        customer_id: customersData?.[0]?.id,
        invoice_id: invoicesData?.[0]?.id,
        amount: 380.63,
        payment_method: 'card',
        status: 'completed',
        transaction_date: '2024-01-20T10:30:00Z',
        processed_at: '2024-01-20T10:30:05Z',
        description: 'Payment for annual testing'
      },
      {
        customer_id: customersData?.[1]?.id,
        invoice_id: invoicesData?.[1]?.id,
        amount: 1305.00,
        payment_method: 'check',
        status: 'completed', 
        transaction_date: '2024-02-15T14:20:00Z',
        processed_at: '2024-02-15T14:20:10Z',
        description: 'Payment for installation'
      }
    ];

    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .insert(payments)
      .select();
    
    if (paymentsError) {
      console.error('❌ Error adding payments:', paymentsError);
    } else {
      console.log('✅ Added', paymentsData.length, 'payments');
    }

    console.log('🎉 Test data population complete!');
    console.log('📊 Summary:');
    console.log(`   • ${customersData?.length || 0} customers added`);
    console.log(`   • ${leadsData?.length || 0} leads added`);
    console.log(`   • ${invoicesData?.length || 0} invoices added`); 
    console.log(`   • ${paymentsData?.length || 0} payments added`);

  } catch (error) {
    console.error('💥 Error populating test data:', error);
  }
}

populateTestData();