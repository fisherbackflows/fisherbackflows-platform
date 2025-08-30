const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testMinimalAppointment() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔍 Testing minimal appointment creation to find valid columns...');

  try {
    // Get a customer ID
    const { data: customers } = await supabase
      .from('customers')
      .select('id')
      .limit(1);
      
    if (!customers || customers.length === 0) {
      console.log('❌ No customers found');
      return;
    }

    const customerId = customers[0].id;
    console.log('✅ Using customer ID:', customerId);

    // Try minimal appointment with only essential fields
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        customer_id: customerId,
        scheduled_date: '2025-09-01',
        scheduled_time_start: '10:00:00'
      })
      .select();
    
    if (error) {
      console.log('❌ Error with minimal fields:', error.message);
      
      // Try even more minimal
      const { data: data2, error: error2 } = await supabase
        .from('appointments')
        .insert({
          customer_id: customerId
        })
        .select();
        
      if (error2) {
        console.log('❌ Error with just customer_id:', error2.message);
      } else {
        console.log('✅ Success with just customer_id! Column structure:');
        console.log(Object.keys(data2[0]));
        
        // Clean up
        await supabase
          .from('appointments')
          .delete()
          .eq('id', data2[0].id);
      }
    } else {
      console.log('✅ Success with minimal fields! Column structure:');
      console.log(Object.keys(data[0]));
      
      // Clean up
      await supabase
        .from('appointments')
        .delete()
        .eq('id', data[0].id);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testMinimalAppointment();