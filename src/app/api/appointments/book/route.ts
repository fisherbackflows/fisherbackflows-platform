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

    // Validate date format and ensure it's not in the past
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(appointmentDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }
    
    if (appointmentDate < today) {
      return NextResponse.json(
        { error: 'Cannot book appointments in the past' },
        { status: 400 }
      );
    }

    // Validate time format - support flexible time formats
    const timeRegex = /^(0?[1-9]|1[0-2]):(00|30)\s?(AM|PM)$/i;
    if (!timeRegex.test(time) && !time.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use format like "9:00 AM" or "14:30:00"' },
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
    const convertTimeToDBFormat = (timeStr: string): string => {
      // If already in HH:MM:SS format, return as-is
      if (timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) {
        return timeStr;
      }
      
      // Parse AM/PM format
      const match = timeStr.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
      if (!match) return timeStr; // Fallback
      
      let hour = parseInt(match[1]);
      const minute = match[2];
      const ampm = match[3].toLowerCase();
      
      // Convert to 24-hour format
      if (ampm === 'pm' && hour !== 12) {
        hour += 12;
      } else if (ampm === 'am' && hour === 12) {
        hour = 0;
      }
      
      return `${hour.toString().padStart(2, '0')}:${minute}:00`;
    };
    
    const dbTime = convertTimeToDBFormat(time);
    
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
    
    // For now, create appointments without automatic technician assignment
    // Technician assignment can be done later through the admin interface
    let assignedTechnicianId = null;
    let assignedTechnicianName = 'To be assigned';
    
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
    
    // Create basic appointment data with only essential fields
    const appointmentData = {
      customer_id: customerId,
      scheduled_date: date,
      scheduled_time_start: dbTime,
      status: 'scheduled'
    };
    
    // Add optional fields if they exist in the database schema
    if (serviceType) appointmentData.appointment_type = serviceType;
    if (notes || deviceInfo) appointmentData.special_instructions = notes ? `${notes}${deviceInfo ? `. ${deviceInfo}` : ''}` : deviceInfo;
    
    const { data: appointment, error: createError } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select('*')
      .single();
    
    if (createError) {
      console.error('Error creating appointment:', createError);
      return NextResponse.json(
        { error: 'Failed to create appointment: ' + createError.message },
        { status: 500 }
      );
    }

    // Get customer information for email confirmation
    let customerEmail = null;
    let customerName = 'Customer';
    
    if (appointment) {
      try {
        const { data: customer } = await supabase
          .from('customers')
          .select('first_name, last_name, email')
          .eq('id', customerId)
          .single();
          
        if (customer) {
          customerName = `${customer.first_name} ${customer.last_name}`;
          customerEmail = customer.email;
          
          // Send confirmation email
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
      } catch (customerError) {
        console.error('⚠️ Failed to fetch customer for email:', customerError);
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