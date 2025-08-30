const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testDBAppointments() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔍 Testing direct database appointment query...');

  try {
    // Query appointments directly
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .order('scheduled_date', { ascending: true });
    
    if (error) {
      console.log('❌ Database error:', error.message);
      console.log('Details:', error);
    } else {
      console.log(`✅ Found ${appointments?.length || 0} appointments in database`);
      
      if (appointments && appointments.length > 0) {
        console.log('\n📋 Appointments in database:');
        appointments.forEach((apt, i) => {
          console.log(`   ${i+1}. ID: ${apt.id}`);
          console.log(`      Date: ${apt.scheduled_date}`);
          console.log(`      Time: ${apt.scheduled_time_start}`);
          console.log(`      Type: ${apt.appointment_type}`);
          console.log(`      Status: ${apt.status}`);
          console.log(`      Customer: ${apt.customer_id}`);
          if (apt.special_instructions) {
            console.log(`      Instructions: ${apt.special_instructions}`);
          }
          console.log();
        });
      }
    }
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

testDBAppointments();