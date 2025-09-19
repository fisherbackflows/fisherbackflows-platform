#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function debugDatabaseInsert() {
  console.log('🔍 Debugging direct database appointment insertion...');
  
  try {
    const supabase = createClient(
      'https://jvhbqfueutvfepsjmztx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2aGJxZnVldXR2ZmVwc2ptenR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI3MzQ3NSwiZXhwIjoyMDcxODQ5NDc1fQ.UNDLGdqkRe26QyOzXltQ7y4KwcTCuuqxsgB-a1r3VrY'
    );
    
    // Get a customer ID
    const { data: customers } = await supabase.from('customers').select('id').limit(1);
    if (!customers?.length) {
      console.error('❌ No customers found');
      return;
    }
    
    const customerId = customers[0].id;
    console.log('✅ Using customer ID:', customerId);
    
    // Test the exact data structure that our API is trying to insert
    const appointmentData = {
      customer_id: customerId,
      appointment_type: 'annual_test',
      scheduled_date: '2025-09-18',
      scheduled_time_start: '16:00',  // Explicit time
      estimated_duration: 60,
      special_instructions: 'Direct database test',
      status: 'scheduled',
      created_at: new Date().toISOString()
    };
    
    console.log('📤 Inserting appointment data:');
    console.log(JSON.stringify(appointmentData, null, 2));
    
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select('*')
      .single();
      
    if (error) {
      console.error('❌ Database insert failed:', error);
      console.error('   Code:', error.code);
      console.error('   Details:', error.details);
      console.error('   Hint:', error.hint);
    } else {
      console.log('✅ Database insert successful!');
      console.log('📄 Created appointment:', appointment.id);
      console.log('📅 Date/Time:', appointment.scheduled_date, appointment.scheduled_time_start);
    }
    
    // Now test with different time formats
    console.log('\n🔄 Testing different time formats...');
    
    const timeFormats = [
      '17:00',
      '17:00:00', 
      '5:00 PM',
      '17:30'
    ];
    
    for (const timeFormat of timeFormats) {
      console.log(`\n🧪 Testing time format: "${timeFormat}"`);
      
      const testData = {
        customer_id: customerId,
        appointment_type: 'annual_test',
        scheduled_date: '2025-09-19',
        scheduled_time_start: timeFormat,
        estimated_duration: 60,
        special_instructions: `Time format test: ${timeFormat}`,
        status: 'scheduled'
      };
      
      const { data, error } = await supabase
        .from('appointments')
        .insert(testData)
        .select('scheduled_time_start')
        .single();
        
      if (error) {
        console.log(`❌ Format "${timeFormat}" failed:`, error.message);
      } else {
        console.log(`✅ Format "${timeFormat}" succeeded:`, data.scheduled_time_start);
      }
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

debugDatabaseInsert();