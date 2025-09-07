const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jvhbqfueutvfepsjmztx.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickAddData() {
  console.log('🚀 Quick adding essential data...');

  try {
    // Add invoices with revenue
    console.log('💰 Adding invoices...');
    const invoices = [
      {
        invoice_number: 'INV-2024-001',
        invoice_date: '2024-01-15',
        due_date: '2024-02-15',
        subtotal: 350.00,
        tax_amount: 30.63,
        total_amount: 380.63,
        amount_paid: 380.63,
        status: 'paid',
        payment_status: 'paid',
        description: 'Annual backflow testing service',
        paid_date: '2024-01-20'
      },
      {
        invoice_number: 'INV-2024-002', 
        invoice_date: '2024-02-10',
        due_date: '2024-03-10',
        subtotal: 1200.00,
        tax_amount: 105.00,
        total_amount: 1305.00,
        amount_paid: 1305.00,
        status: 'paid',
        payment_status: 'paid',
        description: 'New backflow preventer installation',
        paid_date: '2024-02-15'
      },
      {
        invoice_number: 'INV-2024-003',
        invoice_date: '2024-11-01',
        due_date: '2024-12-01', 
        subtotal: 275.00,
        tax_amount: 24.06,
        total_amount: 299.06,
        amount_paid: 0,
        status: 'sent',
        payment_status: 'unpaid',
        description: 'Annual backflow testing'
      }
    ];

    // Skip customer_id for now to avoid foreign key issues
    const invoicesForInsert = invoices.map(inv => ({
      ...inv,
      customer_id: null
    }));

    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .insert(invoicesForInsert)
      .select();
    
    if (invoicesError) {
      console.error('❌ Error adding invoices:', invoicesError);
    } else {
      console.log('✅ Added', invoicesData.length, 'invoices');
    }

    console.log('✅ Quick data addition complete!');

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

quickAddData();