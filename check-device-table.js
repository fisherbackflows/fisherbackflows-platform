const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkDevicesTable() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔍 Checking devices table structure...');

  try {
    // Get a real customer ID first
    const { data: customers } = await supabase
      .from('customers')
      .select('id')
      .limit(1);
    
    if (!customers || customers.length === 0) {
      console.log('No customers found');
      return;
    }
    
    const customerId = customers[0].id;
    console.log('✅ Using customer ID:', customerId);

    // Try to insert minimal device to see what fields are required/available
    const { data, error } = await supabase
      .from('devices')
      .insert({
        customer_id: customerId,
        device_type: 'Test Device',
        manufacturer: 'Test Mfg',
        model: 'Test Model'
      })
      .select();
    
    if (error) {
      console.log('❌ Insert error:', error.message);
      console.log('Code:', error.code);
      console.log('Details:', error.details);
      
      // Try with additional common fields
      console.log('\n🔄 Trying with more fields...');
      const { data: data2, error: error2 } = await supabase
        .from('devices')
        .insert({
          customer_id: customerId,
          device_type: 'Test Device',
          manufacturer: 'Test Mfg',
          model: 'Test Model',
          size_inches: '3/4"',
          serial_number: 'TEST-001',
          location_description: 'Test Location',
          installation_date: '2024-01-01',
          next_test_due: '2025-01-01',
          device_status: 'Active'
        })
        .select();
      
      if (error2) {
        console.log('❌ Second attempt error:', error2.message);
      } else {
        console.log('✅ Success! Device table columns:');
        console.log(Object.keys(data2[0]));
        
        // Clean up - delete the test device
        await supabase
          .from('devices')
          .delete()
          .eq('id', data2[0].id);
        
        console.log('🧹 Test device cleaned up');
      }
    } else {
      console.log('✅ Success! Device table columns:');
      console.log(Object.keys(data[0]));
      
      // Clean up - delete the test device
      await supabase
        .from('devices')
        .delete()
        .eq('id', data[0].id);
      
      console.log('🧹 Test device cleaned up');
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkDevicesTable();