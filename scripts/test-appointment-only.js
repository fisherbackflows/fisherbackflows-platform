#!/usr/bin/env node

const fetch = require('node-fetch');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function testAppointmentOnly() {
  console.log('🧪 Testing Appointment Booking API with Debug...');
  
  try {
    // Get real customer data
    const supabase = createClient(
      'https://jvhbqfueutvfepsjmztx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY'
    );
    
    const { data: testCustomers } = await supabase.from('customers').select('id, first_name, last_name, email').limit(1);
    if (!testCustomers?.length) {
      console.error('❌ No customers found');
      return;
    }
    
    // Load session
    const sessionData = JSON.parse(fs.readFileSync('./test-session.json', 'utf8'));
    const sessionToken = sessionData.sessionToken;
    
    const baseURL = 'http://localhost:3010';
    const headers = {
      'Cookie': `team_session=${sessionToken}`,
      'Content-Type': 'application/json'
    };
    
    const testAppointment = {
      customerId: testCustomers[0].id,
      customerName: `${testCustomers[0].first_name} ${testCustomers[0].last_name}`,
      customerEmail: testCustomers[0].email,
      customerPhone: '(253) 555-TEST',
      serviceType: 'annual_test',
      date: '2025-09-17',
      timeSlot: '15:00',  // Using timeSlot
      duration: 60,
      specialInstructions: 'Debug test appointment'
    };
    
    console.log('📤 Sending appointment request:');
    console.log(JSON.stringify(testAppointment, null, 2));
    
    const response = await fetch(`${baseURL}/api/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testAppointment)
    });
    
    console.log('\n📥 Response status:', response.status);
    const responseText = await response.text();
    console.log('📥 Response body:', responseText);
    
    if (response.ok) {
      console.log('\n✅ SUCCESS - Appointment booking working!');
    } else {
      console.log('\n❌ FAILED - Check server logs for debug output');
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

testAppointmentOnly();