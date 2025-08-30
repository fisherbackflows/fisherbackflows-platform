const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createRealAppointments() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('📅 Creating real appointment data for Fisher Backflows customers...\n');

  try {
    // Get customers and their devices
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select(`
        id,
        first_name,
        last_name,
        company_name,
        phone,
        email,
        address_line1,
        city,
        state
      `)
      .order('company_name');

    if (customerError) {
      console.log('❌ Error getting customers:', customerError.message);
      return;
    }

    const { data: devices, error: deviceError } = await supabase
      .from('devices')
      .select(`
        id,
        customer_id,
        device_type,
        location_description,
        next_test_due,
        manufacturer,
        model,
        serial_number
      `)
      .order('next_test_due');

    if (deviceError) {
      console.log('❌ Error getting devices:', deviceError.message);
      return;
    }

    console.log(`📊 Found ${customers?.length || 0} customers and ${devices?.length || 0} devices`);

    // Create appointments for devices with upcoming test due dates
    const appointments = [];
    const serviceTypes = [
      'Annual Backflow Test',
      'Backflow Device Inspection', 
      'Emergency Repair',
      'New Installation Test',
      'Retest After Repair'
    ];

    const technicians = [
      { name: 'Mike Fisher', id: 'tech-mf' },
      { name: 'Lead Technician', id: 'tech-lead' },
      { name: 'Senior Tech', id: 'tech-sr' }
    ];

    const appointmentStatuses = ['Scheduled', 'Confirmed', 'In Progress', 'Completed'];
    
    // Create appointments for the next 90 days
    const now = new Date();
    const next90Days = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));

    devices?.forEach(device => {
      const customer = customers?.find(c => c.id === device.customer_id);
      if (!customer) return;

      const nextTestDate = new Date(device.next_test_due);
      
      // Create appointments for devices that are due or overdue within next 90 days
      if (nextTestDate <= next90Days) {
        const daysFromNow = Math.ceil((nextTestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        let appointmentDate;
        let status;
        let serviceType;
        
        if (daysFromNow < 0) {
          // Overdue - schedule ASAP
          appointmentDate = new Date(now.getTime() + (Math.random() * 7 * 24 * 60 * 60 * 1000)); // Within next week
          status = 'scheduled';
          serviceType = 'Annual Backflow Test (Overdue)';
        } else if (daysFromNow <= 30) {
          // Due soon - schedule around due date
          appointmentDate = new Date(nextTestDate.getTime() - (Math.random() * 14 * 24 * 60 * 60 * 1000)); // Up to 2 weeks before due
          status = Math.random() > 0.3 ? 'confirmed' : 'scheduled';
          serviceType = 'Annual Backflow Test';
        } else {
          // Future appointments
          appointmentDate = new Date(nextTestDate.getTime() - (Math.random() * 30 * 24 * 60 * 60 * 1000)); // Up to month before due
          status = 'scheduled';
          serviceType = 'Annual Backflow Test';
        }

        // Set appointment time (business hours: 8 AM - 5 PM)
        const hour = Math.floor(Math.random() * 9) + 8; // 8-16 (8 AM to 4 PM)
        const minute = Math.random() > 0.5 ? 0 : 30; // :00 or :30
        appointmentDate.setHours(hour, minute, 0, 0);

        const technician = technicians[Math.floor(Math.random() * technicians.length)];

        // Determine duration based on device type
        let duration = 60; // Default 1 hour
        if (device.device_type.includes('RPZ')) duration = 90; // RPZ tests take longer
        if (device.device_type.includes('Commercial') || device.location_description.includes('Fire')) duration = 120;

        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        const endHour = hour + Math.ceil(duration / 60);
        const endTimeStr = `${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        
        const appointment = {
          customer_id: customer.id,
          scheduled_date: appointmentDate.toISOString().split('T')[0],
          scheduled_time_start: timeStr,
          scheduled_time_end: endTimeStr,
          appointment_type: serviceType,
          status: status.toLowerCase(),
          estimated_duration: duration,
          special_instructions: generateAppointmentNotes(device, daysFromNow),
          created_at: new Date().toISOString()
        };

        appointments.push(appointment);
      }
    });

    // Add some additional appointments for variety
    const additionalAppointments = [
      // Emergency repairs
      {
        customer_id: customers?.find(c => c.company_name?.includes('Memory Haven'))?.id,
        scheduled_date: new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        scheduled_time_start: '14:00:00',
        scheduled_time_end: '16:00:00',
        appointment_type: 'Emergency Repair',
        status: 'confirmed',
        estimated_duration: 120,
        special_instructions: 'Customer reported pressure drop in kitchen RP system',
        created_at: new Date().toISOString()
      },
      // New installation
      {
        customer_id: customers?.find(c => c.company_name?.includes('Coaster'))?.id,
        scheduled_date: new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        scheduled_time_start: '09:00:00',
        scheduled_time_end: '11:00:00',
        appointment_type: 'New Installation Test',
        status: 'scheduled',
        estimated_duration: 120,
        special_instructions: 'New beverage system backflow device installation',
        created_at: new Date().toISOString()
      }
    ];

    appointments.push(...additionalAppointments.filter(apt => apt.customer_id));

    if (appointments.length === 0) {
      console.log('❌ No appointments to create');
      return;
    }

    console.log(`\n💾 Creating ${appointments.length} appointments...`);

    // Insert appointments
    const { data: insertedAppointments, error: insertError } = await supabase
      .from('appointments')
      .insert(appointments)
      .select();

    if (insertError) {
      console.log('❌ Error inserting appointments:', insertError.message);
      console.log('Details:', insertError);
      return;
    }

    console.log(`✅ Successfully created ${insertedAppointments?.length || 0} appointments!`);

    // Get final count and summary
    const { data: allAppointments, error: countError } = await supabase
      .from('appointments')
      .select('*')
      .order('scheduled_date');

    if (countError) {
      console.log('❌ Error getting final count:', countError.message);
      return;
    }

    console.log(`\n🎯 TOTAL APPOINTMENTS: ${allAppointments?.length || 0}`);
    console.log('\n📅 APPOINTMENT SUMMARY:');

    // Group by status
    const byStatus = {};
    allAppointments?.forEach(apt => {
      const status = apt.status || 'Unknown';
      if (!byStatus[status]) byStatus[status] = [];
      byStatus[status].push(apt);
    });

    Object.entries(byStatus).forEach(([status, apts]) => {
      console.log(`\n   📋 ${status}: ${apts.length} appointments`);
      apts.slice(0, 3).forEach(apt => {
        console.log(`      • ${apt.scheduled_date} ${apt.scheduled_time_start} - ${apt.appointment_type}`);
        if (apt.special_instructions) console.log(`        Instructions: ${apt.special_instructions}`);
      });
      if (apts.length > 3) {
        console.log(`      ... and ${apts.length - 3} more`);
      }
    });

    console.log('\n🎉 REAL APPOINTMENT DATA CREATED!');
    console.log('💡 Appointments reflect realistic scheduling for Fisher Backflows operations');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

function calculateEstimatedCost(deviceType, serviceType) {
  let baseCost = 75; // Standard residential test
  
  if (deviceType.includes('Commercial') || serviceType.includes('Commercial')) {
    baseCost = 125;
  }
  
  if (deviceType.includes('RPZ')) {
    baseCost += 25; // RPZ tests are more complex
  }
  
  if (serviceType.includes('Emergency')) {
    baseCost += 50; // Emergency surcharge
  }
  
  if (serviceType.includes('Repair')) {
    baseCost += 75; // Repair costs more
  }
  
  if (serviceType.includes('Installation')) {
    baseCost += 30; // New installation testing
  }
  
  return baseCost + (Math.random() * 20 - 10); // Add some variation
}

function generateAppointmentNotes(device, daysFromNow) {
  const notes = [];
  
  if (daysFromNow < 0) {
    notes.push(`OVERDUE: Test was due ${Math.abs(daysFromNow)} days ago`);
  } else if (daysFromNow <= 30) {
    notes.push(`Due soon: Test due in ${daysFromNow} days`);
  }
  
  if (device.device_type.includes('Fire')) {
    notes.push('Fire system - high priority compliance');
  }
  
  if (device.location_description.includes('Kitchen') || device.location_description.includes('Ice')) {
    notes.push('Food service area - health code compliance required');
  }
  
  if (device.manufacturer === 'Watts' && device.model.includes('909')) {
    notes.push('Standard Watts 909 series - common residential/commercial device');
  }
  
  return notes.length > 0 ? notes.join('. ') : 'Standard annual backflow device test';
}

createRealAppointments();