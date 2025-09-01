#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function createTestInvoices() {
  try {
    const supabase = createClient(
      'https://jvhbqfueutvfepsjmztx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY'
    );

    console.log('🔄 Creating test invoice data...');
    
    // Get a customer to create invoice for
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email')
      .limit(3);
      
    if (customerError || !customers?.length) {
      console.error('❌ No customers found:', customerError?.message);
      return;
    }
    
    console.log(`✅ Found ${customers.length} customers`);
    
    // Create test invoices
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      const invoiceNumber = `INV-2025-${String(i + 1).padStart(3, '0')}`;
      
      console.log(`🔨 Creating invoice ${invoiceNumber} for ${customer.first_name} ${customer.last_name}...`);
      
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .upsert({
          invoice_number: invoiceNumber,
          customer_id: customer.id,
          invoice_date: '2025-09-01',
          due_date: '2025-10-01',
          subtotal: 75.00,
          tax_rate: 9.80,
          tax_amount: 7.35,
          total_amount: 82.35,
          balance_due: 82.35,
          status: i === 0 ? 'sent' : i === 1 ? 'paid' : 'draft'
        })
        .select()
        .single();
        
      if (invoiceError) {
        console.error(`❌ Error creating invoice ${invoiceNumber}:`, invoiceError.message);
        continue;
      }
      
      console.log(`✅ Created invoice ${invoiceNumber}`);
      
      // Create line items for this invoice
      const lineItems = [
        {
          description: 'Annual Backflow Preventer Testing - 3/4" Device',
          quantity: 1,
          unit_price: 75.00,
          total_price: 75.00,
          item_type: 'service'
        }
      ];
      
      for (const item of lineItems) {
        const { error: lineItemError } = await supabase
          .from('invoice_line_items')
          .upsert({
            invoice_id: invoice.id,
            ...item
          });
          
        if (lineItemError) {
          console.error(`❌ Error creating line item:`, lineItemError.message);
        } else {
          console.log(`  ✅ Added line item: ${item.description}`);
        }
      }
    }
    
    // Verify invoice data
    console.log('\n🔍 Verifying invoice data...');
    const { data: invoices, error: verifyError } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(first_name, last_name, email),
        invoice_line_items(*)
      `);
      
    if (verifyError) {
      console.error('❌ Error verifying invoices:', verifyError.message);
    } else {
      console.log(`✅ Created ${invoices.length} invoices with line items`);
      invoices.forEach(inv => {
        console.log(`  📄 ${inv.invoice_number}: ${inv.customer.first_name} ${inv.customer.last_name} - $${inv.total_amount} (${inv.status})`);
      });
    }
    
    console.log('\n🎉 Test invoice data created successfully!');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

createTestInvoices();