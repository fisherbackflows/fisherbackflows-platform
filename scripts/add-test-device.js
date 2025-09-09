const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jvhbqfueutvfepsjmztx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY'
);

async function addTestDevices() {
  console.log('Adding test devices for customers...');
  
  // Get all customers
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, email, first_name, last_name')
    .limit(5);
  
  if (customersError) {
    console.error('Error fetching customers:', customersError);
    return;
  }
  
  console.log(`Found ${customers.length} customers`);
  
  for (const customer of customers) {
    console.log(`\nAdding device for ${customer.email}...`);
    
    // Create a test device - using minimal fields that should exist
    const deviceData = {
      customer_id: customer.id,
      serial_number: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      manufacturer: 'Watts',
      model: 'Series 909',
      size: '3/4"',
      type: 'RP', // Reduced Pressure
      location_description: customer.address_line1 || '123 Main St',
      device_type: 'reduced_pressure',
      size_inches: '0.75',
      installation_date: '2023-01-15',
      last_test_date: '2024-01-15',
      next_test_due: '2025-01-15',
      device_status: 'active'
    };
    
    // Try inserting with different field combinations
    let inserted = false;
    
    // Attempt 1: Try the complete schema
    if (!inserted) {
      const { data, error } = await supabase
        .from('devices')
        .insert({
          customer_id: customer.id,
          device_type: 'reduced_pressure',
          manufacturer: 'Watts',
          model: 'Series 909',
          serial_number: deviceData.serial_number,
          size_inches: '0.75',
          location_description: deviceData.location_description,
          installation_date: '2023-01-15',
          last_test_date: '2024-01-15',
          next_test_due: '2025-01-15',
          device_status: 'active'
        })
        .select();
      
      if (!error) {
        console.log('✓ Device added with schema v1');
        inserted = true;
      }
    }
    
    // Attempt 2: Try minimal fields
    if (!inserted) {
      const { data, error } = await supabase
        .from('devices')
        .insert({
          customer_id: customer.id,
          serial_number: deviceData.serial_number,
          type: 'RP',
          size: '3/4"',
          location: deviceData.location_description,
          next_test_date: '2025-01-15'
        })
        .select();
      
      if (!error) {
        console.log('✓ Device added with schema v2');
        inserted = true;
      }
    }
    
    // Attempt 3: Absolute minimal
    if (!inserted) {
      const { data, error } = await supabase
        .from('devices')
        .insert({
          customer_id: customer.id,
          serial_number: deviceData.serial_number
        })
        .select();
      
      if (!error) {
        console.log('✓ Device added with minimal fields');
        inserted = true;
      } else {
        console.log('✗ Failed to add device:', error.message);
      }
    }
  }
  
  // Check what we have
  const { data: allDevices, error: devicesError } = await supabase
    .from('devices')
    .select('*')
    .limit(10);
  
  console.log('\n--- Current Devices ---');
  if (allDevices && allDevices.length > 0) {
    console.log(`Found ${allDevices.length} devices`);
    console.log('Sample device structure:', Object.keys(allDevices[0]));
  } else {
    console.log('No devices found');
  }
}

addTestDevices();