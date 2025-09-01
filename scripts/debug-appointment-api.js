#!/usr/bin/env node

const fetch = require('node-fetch');
const fs = require('fs');

async function debugAppointmentAPI() {
  console.log('🔍 Debugging appointment booking API...');
  
  try {
    // Get a real customer ID from database
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      'https://jvhbqfueutvfepsjmztx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY'
    );
    
    const { data: customers } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email')
      .limit(1);
      
    if (!customers?.length) {
      console.error('❌ No customers found in database');
      return;
    }
    
    const realCustomerId = customers[0].id;
    console.log('✅ Using real customer ID:', realCustomerId);
    
    // Load session
    const sessionData = JSON.parse(fs.readFileSync('./test-session.json', 'utf8'));
    const sessionToken = sessionData.sessionToken;
    
    const baseURL = 'http://localhost:3010';
    const headers = {
      'Cookie': `team_session=${sessionToken}`,
      'Content-Type': 'application/json'
    };
    
    const testAppointment = {
      customerId: realCustomerId,
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '(253) 555-0123',
      customerAddress: '123 Test Street, Tacoma, WA 98402',
      serviceType: 'annual_test',
      date: '2025-09-15',
      timeSlot: '10:00',  // Using timeSlot field
      time: '10:00',      // Also adding time field for redundancy
      deviceInfo: 'Test device for API validation',
      specialInstructions: 'API test appointment - can be cancelled',
      duration: 60
    };
    
    console.log('📤 Sending appointment data:');
    console.log(JSON.stringify(testAppointment, null, 2));
    
    const response = await fetch(`${baseURL}/api/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testAppointment)
    });
    
    console.log('\n📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('📥 Response body:', responseText);
    
    if (response.ok) {
      try {
        const responseData = JSON.parse(responseText);
        console.log('\n✅ Appointment created successfully!');
        console.log('📄 Created appointment:', JSON.stringify(responseData, null, 2));
      } catch (e) {
        console.log('✅ Response was OK but not JSON:', responseText);
      }
    } else {
      console.log('\n❌ Appointment creation failed');
      
      try {
        const errorData = JSON.parse(responseText);
        console.log('💥 Error details:', errorData);
      } catch (e) {
        console.log('💥 Raw error:', responseText);
      }
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

debugAppointmentAPI();