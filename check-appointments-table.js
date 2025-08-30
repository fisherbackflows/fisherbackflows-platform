const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkAppointmentsTable() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔍 Checking appointments table structure...');

  try {
    // Get customers and devices for valid IDs
    const { data: customers } = await supabase
      .from('customers')
      .select('id')
      .limit(1);
      
    const { data: devices } = await supabase
      .from('devices')
      .select('id')
      .limit(1);

    if (!customers || !devices || customers.length === 0 || devices.length === 0) {
      console.log('❌ No customers or devices found');
      return;
    }

    const customerId = customers[0].id;
    const deviceId = devices[0].id;

    console.log('✅ Using customer ID:', customerId);
    console.log('✅ Using device ID:', deviceId);

    // Try to insert minimal appointment
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        customer_id: customerId,
        scheduled_date: '2025-09-01',
        scheduled_time: '10:00',
        service_type: 'Test'
      })
      .select();
    
    if (error) {
      console.log('❌ Insert error:', error.message);
      console.log('Code:', error.code);
      console.log('Details:', error.details);
      
      // Try with additional fields
      console.log('\n🔄 Trying with more fields...');
      const { data: data2, error: error2 } = await supabase
        .from('appointments')
        .insert({
          customer_id: customerId,
          device_id: deviceId,
          scheduled_date: '2025-09-01',
          scheduled_time: '10:00',
          duration: 60,
          service_type: 'Test Appointment',
          status: 'scheduled',
          technician_assigned: 'Test Tech',
          notes: 'Test appointment'
        })
        .select();
      
      if (error2) {
        console.log('❌ Second attempt error:', error2.message);
        console.log('Details:', error2.details);
      } else {
        console.log('✅ Success! Appointments table columns:');
        console.log(Object.keys(data2[0]));
        
        // Clean up
        await supabase
          .from('appointments')
          .delete()
          .eq('id', data2[0].id);
        
        console.log('🧹 Test appointment cleaned up');
      }
    } else {
      console.log('✅ Success! Appointments table columns:');
      console.log(Object.keys(data[0]));
      
      // Clean up
      await supabase
        .from('appointments')
        .delete()
        .eq('id', data[0].id);
      
      console.log('🧹 Test appointment cleaned up');
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAppointmentsTable();