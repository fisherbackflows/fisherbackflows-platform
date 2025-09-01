#!/usr/bin/env node

const fetch = require('node-fetch');

async function testAPIs() {
  const baseURL = 'http://localhost:3010';
  
  console.log('🔄 Testing API endpoints...');
  
  try {
    // First, authenticate to get a session
    console.log('🔐 Authenticating admin user...');
    const authResponse = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@fisherbackflows.com',
        password: 'FisherAdmin2025',
        loginType: 'team'
      })
    });
    
    let authToken = '';
    if (authResponse.ok) {
      const authData = await authResponse.json();
      authToken = authData.token || '';
      console.log('✅ Authentication successful');
    } else {
      console.log('❌ Authentication failed:', authResponse.status, await authResponse.text());
    }
    
    // Test invoice detail API with one of our test invoices
    console.log('\n📄 Testing invoice detail API...');
    
    // First get the invoice ID from our database
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      'https://jvhbqfueutvfepsjmztx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY'
    );
    
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, invoice_number')
      .limit(1);
      
    if (invoices?.length) {
      const testInvoiceId = invoices[0].id;
      console.log(`🎯 Testing with invoice ID: ${testInvoiceId} (${invoices[0].invoice_number})`);
      
      const invoiceResponse = await fetch(`${baseURL}/api/invoices/${testInvoiceId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (invoiceResponse.ok) {
        const invoiceData = await invoiceResponse.json();
        console.log('✅ Invoice detail API working!');
        console.log(`  📄 Invoice: ${invoiceData.number}`);
        console.log(`  👤 Customer: ${invoiceData.customerName}`);
        console.log(`  💰 Total: $${invoiceData.total}`);
        console.log(`  📊 Status: ${invoiceData.status}`);
        console.log(`  📋 Line Items: ${invoiceData.items?.length || 0}`);
      } else {
        console.log('❌ Invoice detail API failed:', invoiceResponse.status);
        const errorText = await invoiceResponse.text();
        console.log('   Error:', errorText);
      }
    }
    
    // Test customer detail API
    console.log('\n👤 Testing customer detail API...');
    const { data: customers } = await supabase
      .from('customers')
      .select('id, first_name, last_name')
      .limit(1);
      
    if (customers?.length) {
      const testCustomerId = customers[0].id;
      console.log(`🎯 Testing with customer ID: ${testCustomerId} (${customers[0].first_name} ${customers[0].last_name})`);
      
      const customerResponse = await fetch(`${baseURL}/api/customers/${testCustomerId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (customerResponse.ok) {
        const customerData = await customerResponse.json();
        console.log('✅ Customer detail API working!');
        console.log(`  👤 Customer: ${customerData.name}`);
        console.log(`  📧 Email: ${customerData.email}`);
        console.log(`  📱 Phone: ${customerData.phone}`);
        console.log(`  🏠 Address: ${customerData.address}`);
        console.log(`  🔧 Devices: ${customerData.devices?.length || 0}`);
      } else {
        console.log('❌ Customer detail API failed:', customerResponse.status);
        const errorText = await customerResponse.text();
        console.log('   Error:', errorText);
      }
    }
    
    // Test appointment booking API
    console.log('\n📅 Testing appointment booking API...');
    
    const testAppointment = {
      customerId: customers?.[0]?.id,
      customerName: `${customers?.[0]?.first_name} ${customers?.[0]?.last_name}`,
      customerEmail: 'test@example.com',
      customerPhone: '(253) 555-0123',
      customerAddress: '123 Test Street, Tacoma, WA 98402',
      serviceType: 'annual_test',
      date: '2025-09-15',
      timeSlot: '10:00',
      deviceInfo: 'Test device for API validation',
      specialInstructions: 'API test appointment - can be cancelled'
    };
    
    const appointmentResponse = await fetch(`${baseURL}/api/appointments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testAppointment)
    });
    
    if (appointmentResponse.ok) {
      const appointmentData = await appointmentResponse.json();
      console.log('✅ Appointment booking API working!');
      console.log(`  📅 Date: ${appointmentData.scheduledDate || testAppointment.date}`);
      console.log(`  ⏰ Time: ${appointmentData.scheduledTime || testAppointment.timeSlot}`);
      console.log(`  🎯 Type: ${appointmentData.appointmentType || testAppointment.serviceType}`);
    } else {
      console.log('❌ Appointment booking API failed:', appointmentResponse.status);
      const errorText = await appointmentResponse.text();
      console.log('   Error:', errorText);
    }
    
    console.log('\n🎉 API testing completed!');
    
  } catch (error) {
    console.error('💥 Fatal error during API testing:', error);
  }
}

testAPIs();