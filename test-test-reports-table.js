const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testTestReportsTable() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔍 Testing test_reports table structure...');

  try {
    // Query existing test reports
    const { data: existingReports, error: queryError } = await supabase
      .from('test_reports')
      .select('*')
      .limit(5);
    
    if (queryError) {
      console.log('❌ Query error:', queryError.message);
    } else {
      console.log(`✅ Found ${existingReports?.length || 0} existing test reports in database`);
      
      if (existingReports && existingReports.length > 0) {
        console.log('\n📋 Sample test report structure:');
        console.log(JSON.stringify(existingReports[0], null, 2));
      }
    }

    // Test minimal insert to find table structure
    const { data: customers } = await supabase
      .from('customers')
      .select('id')
      .limit(1);
      
    const { data: devices } = await supabase
      .from('devices')
      .select('id, customer_id')
      .limit(1);
      
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, customer_id')
      .limit(1);
      
    const { data: technicians } = await supabase
      .from('team_users')
      .select('id')
      .eq('role', 'technician')
      .limit(1);

    if (!customers || customers.length === 0 || !devices || devices.length === 0 || !appointments || appointments.length === 0) {
      console.log('❌ No customers, devices, or appointments found for test insert');
      return;
    }

    const customerId = customers[0].id;
    const deviceId = devices[0].id;
    const appointmentId = appointments[0].id;
    const technicianId = technicians && technicians.length > 0 ? technicians[0].id : '3bd0125c-628a-451d-9434-e5441c43e402'; // Admin user ID

    console.log('\n🔧 Testing minimal test report insert...');
    
    console.log(`Using technician ID: ${technicianId || 'None found'}`);
    
    // Try with required fields based on error messages
    const insertData = {
      customer_id: customerId,
      device_id: deviceId,
      appointment_id: appointmentId,
      technician_id: technicianId,
      test_date: '2025-08-30',
      test_time: '10:00:00',
      certifier_name: 'Admin Fisher',
      certifier_number: 'WA12345'
    };
    
    const { data: testInsert, error: insertError } = await supabase
      .from('test_reports')
      .insert(insertData)
      .select();
      
    if (insertError) {
      console.log('❌ Insert error:', insertError.message);
      console.log('Details:', insertError);
    } else if (testInsert && testInsert.length > 0) {
      console.log('✅ Test insert successful! Available columns:');
      console.log(Object.keys(testInsert[0]));
      
      // Clean up test insert
      await supabase
        .from('test_reports')
        .delete()
        .eq('id', testInsert[0].id);
      
      console.log('🧹 Test record cleaned up');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testTestReportsTable();