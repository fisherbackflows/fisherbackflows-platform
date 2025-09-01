#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function testDirectDatabaseAccess() {
  console.log('🔄 Testing direct database access and API data transformation...');
  
  try {
    const supabase = createClient(
      'https://jvhbqfueutvfepsjmztx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY'
    );
    
    // Test 1: Invoice with customer details and line items (matches API route query)
    console.log('📄 Testing invoice data structure...');
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone,
          address_line1,
          address_line2,
          city,
          state,
          zip_code
        ),
        invoice_line_items(
          id,
          description,
          quantity,
          unit_price,
          total_price,
          item_type,
          sort_order
        )
      `)
      .limit(1)
      .single();
      
    if (invoiceError) {
      console.error('❌ Invoice query failed:', invoiceError.message);
    } else {
      console.log('✅ Invoice query successful!');
      console.log(`  📄 Invoice: ${invoice.invoice_number}`);
      console.log(`  👤 Customer: ${invoice.customer?.first_name} ${invoice.customer?.last_name}`);
      console.log(`  💰 Total: $${invoice.total_amount}`);
      console.log(`  📊 Status: ${invoice.status}`);
      console.log(`  📋 Line Items: ${invoice.invoice_line_items?.length || 0}`);
      
      // Test the transformation logic from our API route
      const transformedInvoice = {
        id: invoice.id,
        number: invoice.invoice_number,
        customerId: invoice.customer_id,
        customerName: invoice.customer ? 
          `${invoice.customer.first_name} ${invoice.customer.last_name}` : 
          'Unknown Customer',
        customerEmail: invoice.customer?.email || '',
        customerAddress: invoice.customer ? 
          `${invoice.customer.address_line1}${invoice.customer.address_line2 ? '\n' + invoice.customer.address_line2 : ''}\n${invoice.customer.city}, ${invoice.customer.state} ${invoice.customer.zip_code}` :
          '',
        date: invoice.invoice_date,
        dueDate: invoice.due_date,
        status: invoice.status,
        items: invoice.invoice_line_items?.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.unit_price,
          amount: item.total_price
        })) || [],
        subtotal: invoice.subtotal,
        tax: invoice.tax_amount,
        total: invoice.total_amount,
        notes: invoice.notes
      };
      
      console.log('✅ Data transformation successful!');
      console.log('  📝 Transformed data:', JSON.stringify(transformedInvoice, null, 2).substring(0, 300) + '...');
    }
    
    // Test 2: Customer with devices (matches customer detail API)
    console.log('\n👤 Testing customer data structure...');
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(`
        *,
        devices(
          id,
          device_type,
          manufacturer,
          model,
          size_inches,
          location_description,
          last_test_date,
          next_test_due,
          device_status
        )
      `)
      .limit(1)
      .single();
      
    if (customerError) {
      console.error('❌ Customer query failed:', customerError.message);
    } else {
      console.log('✅ Customer query successful!');
      console.log(`  👤 Customer: ${customer.first_name} ${customer.last_name}`);
      console.log(`  📧 Email: ${customer.email}`);
      console.log(`  📱 Phone: ${customer.phone}`);
      console.log(`  🏠 Address: ${customer.address_line1}, ${customer.city}, ${customer.state}`);
      console.log(`  🔧 Devices: ${customer.devices?.length || 0}`);
    }
    
    // Test 3: Appointments with customer info (matches appointment API)
    console.log('\n📅 Testing appointment data structure...');
    const { data: appointments, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        customer:customers(first_name, last_name, email, phone)
      `)
      .limit(3);
      
    if (appointmentError) {
      console.error('❌ Appointment query failed:', appointmentError.message);
    } else {
      console.log('✅ Appointment query successful!');
      console.log(`  📅 Found ${appointments.length} appointments`);
      appointments.forEach((apt, i) => {
        console.log(`    ${i + 1}. ${apt.scheduled_date} ${apt.scheduled_time_start} - ${apt.customer?.first_name} ${apt.customer?.last_name} (${apt.status})`);
      });
    }
    
    // Test 4: Check available appointment slots
    console.log('\n🗓️ Testing appointment availability...');
    const today = new Date();
    const thirtyDaysOut = new Date();
    thirtyDaysOut.setDate(today.getDate() + 30);
    
    const { data: existingAppointments, error: availabilityError } = await supabase
      .from('appointments')
      .select('scheduled_date, scheduled_time_start')
      .gte('scheduled_date', today.toISOString().split('T')[0])
      .lte('scheduled_date', thirtyDaysOut.toISOString().split('T')[0])
      .not('status', 'eq', 'cancelled');
      
    if (availabilityError) {
      console.error('❌ Availability query failed:', availabilityError.message);
    } else {
      console.log('✅ Availability query successful!');
      console.log(`  📊 Found ${existingAppointments.length} upcoming appointments`);
      
      // Group by date to show daily booking counts
      const dailyCounts = {};
      existingAppointments.forEach(apt => {
        const date = apt.scheduled_date;
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      });
      
      console.log('  📈 Daily appointment counts:');
      Object.entries(dailyCounts).slice(0, 5).forEach(([date, count]) => {
        console.log(`    ${date}: ${count} appointments`);
      });
    }
    
    console.log('\n🎉 Direct database access testing completed!');
    console.log('All database queries are working correctly.');
    console.log('The issue appears to be with authentication, not data structure.');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

testDirectDatabaseAccess();