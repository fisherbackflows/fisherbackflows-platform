import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';
import { sendEmail, emailTemplates } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, deviceId, date, time, serviceType, notes } = body;
    
    // Validate required fields
    if (!customerId || !date || !time) {
      return NextResponse.json(
        { error: 'Customer ID, date, and time are required' },
        { status: 400 }
      );
    }
    
    const supabase = supabaseAdmin || createRouteHandlerClient(request);
    
    // First, check if the time slot is still available
    const { data: existingAppointments, error: checkError } = await supabase
      .from('appointments')
      .select('scheduled_time_start, estimated_duration')
      .eq('scheduled_date', date)
      .neq('status', 'cancelled');
    
    if (checkError) {
      console.error('Error checking availability:', checkError);
      return NextResponse.json(
        { error: 'Unable to verify availability' },
        { status: 500 }
      );
    }
    
    // Convert time format (e.g., "9:00 AM" to "09:00:00")
    const timeFormatMap: { [key: string]: string } = {
      '9:00 AM': '09:00:00',
      '10:00 AM': '10:00:00', 
      '11:00 AM': '11:00:00',
      '1:00 PM': '13:00:00',
      '2:00 PM': '14:00:00',
      '3:00 PM': '15:00:00',
      '4:00 PM': '16:00:00'
    };
    
    const dbTime = timeFormatMap[time] || time;
    
    // Check for conflicts with existing appointments
    const hasConflict = existingAppointments?.some(apt => {
      if (!apt.scheduled_time_start) return false;
      
      const aptTime = apt.scheduled_time_start;
      const aptDuration = apt.estimated_duration || 60;
      
      // Parse appointment time
      const [aptHour, aptMinute] = aptTime.substring(0, 5).split(':').map(Number);
      const aptStartMinutes = aptHour * 60 + aptMinute;
      const aptEndMinutes = aptStartMinutes + aptDuration;
      
      // Parse requested time
      const [reqHour, reqMinute] = dbTime.substring(0, 5).split(':').map(Number);
      const reqStartMinutes = reqHour * 60 + reqMinute;
      const reqEndMinutes = reqStartMinutes + 60; // Assume 1 hour duration
      
      // Check for overlap
      return reqStartMinutes < aptEndMinutes && reqEndMinutes > aptStartMinutes;
    });
    
    if (hasConflict) {
      return NextResponse.json(
        { error: 'Time slot is no longer available' },
        { status: 409 }
      );
    }
    
    // Get available technicians for this date/time slot
    const { data: technicians, error: techError } = await supabase
      .from('team_users')
      .select('id, first_name, last_name, email, role')
      .eq('is_active', true)
      .in('role', ['technician', 'admin']); // Admin can also do tests

    if (techError) {
      console.error('Error fetching technicians:', techError);
    }

    // Find available technician by checking for scheduling conflicts
    let assignedTechnicianId = null;
    let assignedTechnicianName = 'Unassigned';

    if (technicians && technicians.length > 0) {
      // Get existing appointments for this date to check technician availability
      const { data: existingTechAppointments } = await supabase
        .from('appointments')
        .select('technician_id, scheduled_time_start, estimated_duration')
        .eq('scheduled_date', date)
        .neq('status', 'cancelled')
        .not('technician_id', 'is', null);

      // Find first available technician
      const availableTechnician = technicians.find(tech => {
        // Check if technician has conflicting appointment
        const hasConflict = (existingTechAppointments || []).some(apt => {
          if (apt.technician_id !== tech.id) return false;
          
          if (!apt.scheduled_time_start) return false;
          
          // Parse times and check for overlap
          const aptStart = apt.scheduled_time_start.substring(0, 5); // HH:MM
          const aptDuration = apt.estimated_duration || 60;
          
          const [aptHour, aptMin] = aptStart.split(':').map(Number);
          const [slotHour, slotMin] = dbTime.split(':').map(Number);
          
          const aptStartMinutes = aptHour * 60 + aptMin;
          const aptEndMinutes = aptStartMinutes + aptDuration;
          const slotStartMinutes = slotHour * 60 + slotMin;
          const slotEndMinutes = slotStartMinutes + 60; // Assume 1 hour slot
          
          // Check for overlap
          return slotStartMinutes < aptEndMinutes && slotEndMinutes > aptStartMinutes;
        });
        
        return !hasConflict;
      });

      if (availableTechnician) {
        assignedTechnicianId = availableTechnician.id;
        assignedTechnicianName = `${availableTechnician.first_name} ${availableTechnician.last_name}`;
        console.log(`✅ Assigned technician: ${assignedTechnicianName} (${availableTechnician.id})`);
      } else {
        console.log('⚠️ No available technicians found for this time slot');
      }
    }
    
    // Get customer information if deviceId is provided
    let deviceInfo = '';
    if (deviceId) {
      const { data: device } = await supabase
        .from('devices')
        .select('make, model, location')
        .eq('id', deviceId)
        .single();
      
      if (device) {
        deviceInfo = `Device: ${device.make} ${device.model} at ${device.location}`;
      }
    }
    
    // Create the appointment with assigned technician
    const appointmentData = {
      customer_id: customerId,
      technician_id: assignedTechnicianId,
      appointment_type: serviceType || 'annual_test',
      scheduled_date: date,
      scheduled_time_start: dbTime,
      estimated_duration: 60,
      special_instructions: notes ? `${notes}${deviceInfo ? `. ${deviceInfo}` : ''}` : deviceInfo,
      status: 'scheduled',
      created_at: new Date().toISOString()
    };
    
    const { data: appointment, error: createError } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select(`
        *,
        customer:customers(first_name, last_name, email, phone),
        technician:team_users(first_name, last_name, email, role)
      `)
      .single();
    
    if (createError) {
      console.error('Error creating appointment:', createError);
      return NextResponse.json(
        { error: 'Failed to create appointment: ' + createError.message },
        { status: 500 }
      );
    }

    // Send confirmation email to customer
    if (appointment && appointment.customer) {
      const customerName = `${appointment.customer.first_name} ${appointment.customer.last_name}`;
      const customerEmail = appointment.customer.email;
      
      if (customerEmail) {
        try {
          const emailTemplate = emailTemplates.appointmentConfirmation(
            customerName,
            appointment.scheduled_date,
            time, // Use original time format
            serviceType || 'Annual Test'
          );
          
          await sendEmail({
            to: customerEmail,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text
          });
          
          console.log('✅ Confirmation email sent to:', customerEmail);
        } catch (emailError) {
          console.error('⚠️ Failed to send confirmation email:', emailError);
          // Don't fail the appointment creation if email fails
        }
      }
    }
    
    const successMessage = assignedTechnicianId 
      ? `Appointment booked successfully with technician ${assignedTechnicianName} and confirmation email sent`
      : 'Appointment booked successfully (no available technician assigned) and confirmation email sent';

    return NextResponse.json({
      success: true,
      appointment: appointment,
      technician: assignedTechnicianId ? {
        id: assignedTechnicianId,
        name: assignedTechnicianName
      } : null,
      message: successMessage
    });
    
  } catch (error) {
    console.error('Booking API error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}