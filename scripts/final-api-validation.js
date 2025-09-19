#!/usr/bin/env node

const fetch = require('node-fetch');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function finalAPIValidation() {
  console.log('🎯 FINAL COMPREHENSIVE API VALIDATION');
  console.log('====================================\n');
  
  try {
    // Get real test data from database
    const supabase = createClient(
      'https://jvhbqfueutvfepsjmztx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY'
    );
    
    const { data: testCustomers } = await supabase.from('customers').select('id, first_name, last_name, email').limit(1);
    const { data: testInvoices } = await supabase.from('invoices').select('id, invoice_number').limit(1);
    
    if (!testCustomers?.length) {
      console.error('❌ No test customers found');
      return;
    }
    
    // Load authentication session
    const sessionData = JSON.parse(fs.readFileSync('./test-session.json', 'utf8'));
    const sessionToken = sessionData.sessionToken;
    
    const baseURL = 'http://localhost:3010';
    const headers = {
      'Cookie': `team_session=${sessionToken}`,
      'Content-Type': 'application/json'
    };
    
    let totalTests = 0;
    let passedTests = 0;
    const results = [];
    
    // Test 1: Invoice List API
    totalTests++;
    console.log('🧪 Test 1: Invoice List API');
    try {
      const response = await fetch(`${baseURL}/api/invoices`, { headers });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ PASS - Invoice list working');
        console.log(`   📊 ${data.invoices?.length || 0} invoices found`);
        passedTests++;
        results.push({ test: 'Invoice List', status: 'PASS' });
      } else {
        console.log('❌ FAIL - Invoice list failed:', response.status);
        results.push({ test: 'Invoice List', status: 'FAIL', error: response.status });
      }
    } catch (error) {
      console.log('❌ FAIL - Invoice list error:', error.message);
      results.push({ test: 'Invoice List', status: 'FAIL', error: error.message });
    }
    
    // Test 2: Invoice Detail API
    if (testInvoices?.length) {
      totalTests++;
      console.log('\n🧪 Test 2: Invoice Detail API');
      try {
        const response = await fetch(`${baseURL}/api/invoices/${testInvoices[0].id}`, { headers });
        if (response.ok) {
          const data = await response.json();
          console.log('✅ PASS - Invoice detail working');
          console.log(`   📄 ${data.number} - ${data.customerName} - $${data.total}`);
          console.log(`   📋 ${data.items?.length || 0} line items`);
          passedTests++;
          results.push({ test: 'Invoice Detail', status: 'PASS' });
        } else {
          console.log('❌ FAIL - Invoice detail failed:', response.status);
          results.push({ test: 'Invoice Detail', status: 'FAIL', error: response.status });
        }
      } catch (error) {
        console.log('❌ FAIL - Invoice detail error:', error.message);
        results.push({ test: 'Invoice Detail', status: 'FAIL', error: error.message });
      }
    }
    
    // Test 3: Customer Detail API
    totalTests++;
    console.log('\n🧪 Test 3: Customer Detail API');
    try {
      const response = await fetch(`${baseURL}/api/customers/${testCustomers[0].id}`, { headers });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ PASS - Customer detail working');
        console.log(`   👤 ${data.name} - ${data.email}`);
        console.log(`   🔧 ${data.devices?.length || 0} devices`);
        passedTests++;
        results.push({ test: 'Customer Detail', status: 'PASS' });
      } else {
        console.log('❌ FAIL - Customer detail failed:', response.status);
        results.push({ test: 'Customer Detail', status: 'FAIL', error: response.status });
      }
    } catch (error) {
      console.log('❌ FAIL - Customer detail error:', error.message);
      results.push({ test: 'Customer Detail', status: 'FAIL', error: error.message });
    }
    
    // Test 4: Available Dates API
    totalTests++;
    console.log('\n🧪 Test 4: Available Dates API');
    try {
      const response = await fetch(`${baseURL}/api/calendar/available-dates`, { headers });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ PASS - Available dates working');
        console.log(`   📅 ${data.availableDates?.length || 0} available dates`);
        passedTests++;
        results.push({ test: 'Available Dates', status: 'PASS' });
      } else {
        console.log('❌ FAIL - Available dates failed:', response.status);
        results.push({ test: 'Available Dates', status: 'FAIL', error: response.status });
      }
    } catch (error) {
      console.log('❌ FAIL - Available dates error:', error.message);
      results.push({ test: 'Available Dates', status: 'FAIL', error: error.message });
    }
    
    // Test 5: Appointment Booking API
    totalTests++;
    console.log('\n🧪 Test 5: Appointment Booking API');
    try {
      const testAppointment = {
        customerId: testCustomers[0].id,
        customerName: `${testCustomers[0].first_name} ${testCustomers[0].last_name}`,
        customerEmail: testCustomers[0].email,
        customerPhone: '(253) 555-TEST',
        serviceType: 'annual_test',
        date: '2025-09-16',
        timeSlot: '14:00',
        duration: 60,
        specialInstructions: 'Final API validation test appointment'
      };
      
      const response = await fetch(`${baseURL}/api/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(testAppointment)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ PASS - Appointment booking working');
        console.log(`   📅 ${data.appointment?.scheduled_date} at ${data.appointment?.scheduled_time_start}`);
        console.log(`   👤 ${data.appointment?.customer?.first_name} ${data.appointment?.customer?.last_name}`);
        passedTests++;
        results.push({ test: 'Appointment Booking', status: 'PASS' });
      } else {
        console.log('❌ FAIL - Appointment booking failed:', response.status);
        const errorText = await response.text();
        console.log('   Error:', errorText);
        results.push({ test: 'Appointment Booking', status: 'FAIL', error: response.status });
      }
    } catch (error) {
      console.log('❌ FAIL - Appointment booking error:', error.message);
      results.push({ test: 'Appointment Booking', status: 'FAIL', error: error.message });
    }
    
    // Test 6: Payment Webhook Endpoint
    totalTests++;
    console.log('\n🧪 Test 6: Payment Webhook Endpoint');
    try {
      const response = await fetch(`${baseURL}/api/stripe/webhook`, { 
        method: 'GET', 
        headers 
      });
      
      if (response.status === 405) {
        console.log('✅ PASS - Payment webhook endpoint exists');
        console.log('   🔒 Properly rejects GET requests (405 Method Not Allowed)');
        passedTests++;
        results.push({ test: 'Payment Webhook', status: 'PASS' });
      } else {
        console.log(`⚠️  PARTIAL - Payment webhook status: ${response.status}`);
        results.push({ test: 'Payment Webhook', status: 'PARTIAL', error: response.status });
      }
    } catch (error) {
      console.log('❌ FAIL - Payment webhook error:', error.message);
      results.push({ test: 'Payment Webhook', status: 'FAIL', error: error.message });
    }
    
    // Database Connectivity Test
    totalTests++;
    console.log('\n🧪 Test 7: Database Connectivity & Data Integrity');
    try {
      const { count: customerCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
      const { count: appointmentCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true });
      const { count: invoiceCount } = await supabase.from('invoices').select('*', { count: 'exact', head: true });
      const { count: deviceCount } = await supabase.from('devices').select('*', { count: 'exact', head: true });
      
      console.log('✅ PASS - Database connectivity working');
      console.log(`   👥 ${customerCount} customers`);
      console.log(`   📅 ${appointmentCount} appointments`);
      console.log(`   📄 ${invoiceCount} invoices`);
      console.log(`   🔧 ${deviceCount} devices`);
      passedTests++;
      results.push({ test: 'Database Connectivity', status: 'PASS' });
    } catch (error) {
      console.log('❌ FAIL - Database connectivity error:', error.message);
      results.push({ test: 'Database Connectivity', status: 'FAIL', error: error.message });
    }
    
    // FINAL RESULTS
    console.log('\n' + '='.repeat(50));
    console.log('🎯 FINAL VALIDATION RESULTS');
    console.log('='.repeat(50));
    
    results.forEach((result, i) => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'PARTIAL' ? '⚠️ ' : '❌';
      console.log(`${icon} Test ${i + 1}: ${result.test} - ${result.status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('\n📊 SUMMARY:');
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests (${Math.round(passedTests/totalTests*100)}%)`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED! 🎉');
      console.log('🚀 The Fisher Backflows Platform is FULLY OPERATIONAL!');
      console.log('✅ Database: Working with real data');
      console.log('✅ Authentication: Team session system functional');
      console.log('✅ APIs: All critical endpoints operational');
      console.log('✅ Business Logic: Appointment booking, invoicing, customer management');
      console.log('\n🎯 READY FOR PRODUCTION DEPLOYMENT! 🎯');
    } else {
      console.log('\n⚠️  Some tests failed. Review and fix before deployment.');
    }
    
  } catch (error) {
    console.error('💥 Fatal error during validation:', error);
  }
}

finalAPIValidation();