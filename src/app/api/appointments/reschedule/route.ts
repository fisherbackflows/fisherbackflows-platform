import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { cache, CacheKeys } from '@/lib/cache';

const RescheduleSchema = z.object({
  appointmentId: z.string().uuid(),
  customerId: z.string().uuid(),
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  newTime: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.string().optional()
});

// Helper function to get zone hours (same as in booking API)
function getZoneHours(zone: string, dayOfWeek: number): number[] {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  // Check if this zone serves this day
  const northDays = [0, 6, 1, 2]; // Sun, Sat, Mon, Tue
  const southDays = [3, 4, 5]; // Wed, Thu, Fri
  
  if (zone === 'North Puyallup' && !northDays.includes(dayOfWeek)) return [];
  if (zone === 'South Puyallup' && !southDays.includes(dayOfWeek)) return [];
  
  if (isWeekend) {
    return [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]; // 7am-7pm
  } else {
    return [17, 18, 19, 20, 21]; // 5pm-10pm
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = RescheduleSchema.parse(body);
    
    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if appointment exists and belongs to customer
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        id,
        customer_id,
        scheduled_date,
        scheduled_time,
        status,
        service_type,
        notes,
        customers!customer_id (
          name,
          email
        ),
        devices!device_id (
          location,
          device_type,
          id
        )
      `)
      .eq('id', validatedData.appointmentId)
      .eq('customer_id', validatedData.customerId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found or access denied' },
        { status: 404 }
      );
    }

    // Check if appointment can be rescheduled
    if (appointment.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cancelled appointments cannot be rescheduled' },
        { status: 400 }
      );
    }

    if (appointment.status === 'completed') {
      return NextResponse.json(
        { error: 'Completed appointments cannot be rescheduled' },
        { status: 400 }
      );
    }

    // Check if rescheduling is allowed (must be at least 24 hours in advance of current appointment)
    const currentAppointmentDateTime = new Date(`${appointment.scheduled_date}T${appointment.scheduled_time}`);
    const now = new Date();
    const hoursDifference = (currentAppointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDifference < 24) {
      return NextResponse.json(
        { 
          error: 'Appointments can only be rescheduled at least 24 hours in advance',
          canReschedule: false,
          hoursRemaining: Math.round(hoursDifference)
        },
        { status: 400 }
      );
    }

    // Validate new date is in the future
    const newAppointmentDateTime = new Date(`${validatedData.newDate}T${validatedData.newTime}`);
    if (newAppointmentDateTime <= now) {
      return NextResponse.json(
        { error: 'New appointment time must be in the future' },
        { status: 400 }
      );
    }

    // Determine the zone for the new date
    const newDayOfWeek = newAppointmentDateTime.getDay();
    let newZone = '';
    
    if (newDayOfWeek === 0 || newDayOfWeek === 6 || newDayOfWeek === 1 || newDayOfWeek === 2) {
      newZone = 'North Puyallup';
    } else if (newDayOfWeek >= 3 && newDayOfWeek <= 5) {
      newZone = 'South Puyallup';
    }

    // Validate the new time slot is within business hours
    const availableHours = getZoneHours(newZone, newDayOfWeek);
    const newHour = parseInt(validatedData.newTime.split(':')[0]);
    
    if (!availableHours.includes(newHour)) {
      const isWeekend = newDayOfWeek === 0 || newDayOfWeek === 6;
      const businessHours = isWeekend ? '7:00 AM - 7:00 PM' : '5:00 PM - 10:00 PM';
      
      return NextResponse.json(
        { 
          error: `Selected time is not available. ${newZone} service hours are ${businessHours}`,
          availableHours: availableHours,
          businessHours: businessHours
        },
        { status: 400 }
      );
    }

    // Check for conflicts with existing appointments
    const { data: existingAppointments, error: conflictError } = await supabase
      .from('appointments')
      .select('id')
      .eq('scheduled_date', validatedData.newDate)
      .eq('scheduled_time', validatedData.newTime)
      .eq('status', 'scheduled')
      .neq('id', validatedData.appointmentId); // Exclude current appointment

    if (conflictError) {
      console.error('Conflict check error:', conflictError);
      return NextResponse.json(
        { error: 'Unable to verify availability' },
        { status: 500 }
      );
    }

    if (existingAppointments && existingAppointments.length > 0) {
      return NextResponse.json(
        { 
          error: 'The selected time slot is no longer available',
          conflictDetails: {
            conflictingAppointments: existingAppointments.length,
            suggestedAlternatives: await getSuggestedAlternatives(supabase, validatedData.newDate, newZone)
          }
        },
        { status: 409 }
      );
    }

    // Store original appointment data for audit log
    const originalData = {
      scheduled_date: appointment.scheduled_date,
      scheduled_time: appointment.scheduled_time,
      status: appointment.status
    };

    // Update the appointment with new date and time
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update({
        scheduled_date: validatedData.newDate,
        scheduled_time: validatedData.newTime,
        status: 'scheduled', // Reset to scheduled if it was confirmed
        notes: `${appointment.notes || ''}\nRescheduled by customer from ${appointment.scheduled_date} ${appointment.scheduled_time}${validatedData.reason ? `. Reason: ${validatedData.reason}` : ''}`.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.appointmentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error rescheduling appointment:', updateError);
      return NextResponse.json(
        { error: 'Failed to reschedule appointment' },
        { status: 500 }
      );
    }

    // Log the reschedule for audit trail
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'appointments',
        record_id: validatedData.appointmentId,
        action: 'UPDATE',
        old_values: originalData,
        new_values: { 
          scheduled_date: validatedData.newDate,
          scheduled_time: validatedData.newTime,
          rescheduled_by: 'customer',
          reschedule_reason: validatedData.reason
        },
        user_id: validatedData.customerId,
        timestamp: new Date().toISOString()
      });

    // Send reschedule confirmation email
    try {
      const originalDate = new Date(appointment.scheduled_date).toLocaleDateString();
      const newDate = new Date(validatedData.newDate).toLocaleDateString();
      
      await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: appointment.customers?.email,
          subject: 'Appointment Rescheduled - Fisher Backflows',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #059669;">Appointment Rescheduled</h2>
              <p>Hello ${appointment.customers?.name},</p>
              <p>Your backflow testing appointment has been successfully rescheduled:</p>
              
              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <h3 style="color: #dc2626; margin-top: 0;">Previous Appointment:</h3>
                <ul style="margin: 0;">
                  <li><strong>Date:</strong> ${originalDate}</li>
                  <li><strong>Time:</strong> ${appointment.scheduled_time}</li>
                </ul>
              </div>
              
              <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <h3 style="color: #059669; margin-top: 0;">New Appointment:</h3>
                <ul style="margin: 0;">
                  <li><strong>Date:</strong> ${newDate}</li>
                  <li><strong>Time:</strong> ${validatedData.newTime}</li>
                  <li><strong>Zone:</strong> ${newZone}</li>
                  <li><strong>Service:</strong> ${appointment.service_type}</li>
                  <li><strong>Device:</strong> ${appointment.devices?.device_type} at ${appointment.devices?.location}</li>
                </ul>
              </div>
              
              ${validatedData.reason ? `<p><strong>Reason for change:</strong> ${validatedData.reason}</p>` : ''}
              <p>You will receive a new confirmation closer to your appointment date.</p>
              <p>Thank you,<br>Fisher Backflows Team</p>
            </div>
          `
        })
      });
    } catch (emailError) {
      console.error('Failed to send reschedule email:', emailError);
      // Don't fail the reschedule if email fails
    }

    // Invalidate cache for both old and new dates
    // Invalidate cache for both dates
    cache.delete(CacheKeys.availableTimes(appointment.scheduled_date));
    cache.delete(CacheKeys.availableTimes(validatedData.newDate));
    cache.delete(CacheKeys.availableDates());

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
      message: 'Appointment rescheduled successfully',
      newZone: newZone
    });

  } catch (error) {
    console.error('Reschedule appointment API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid reschedule data provided',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to suggest alternative time slots
async function getSuggestedAlternatives(supabase: any, requestedDate: string, zone: string) {
  try {
    const date = new Date(requestedDate);
    const alternatives = [];
    
    // Check same day, different times
    const hours = getZoneHours(zone, date.getDay());
    for (const hour of hours) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      
      const { data: conflicts } = await supabase
        .from('appointments')
        .select('id')
        .eq('scheduled_date', requestedDate)
        .eq('scheduled_time', timeSlot)
        .eq('status', 'scheduled');
      
      if (!conflicts || conflicts.length === 0) {
        alternatives.push({
          date: requestedDate,
          time: timeSlot,
          zone: zone
        });
      }
      
      if (alternatives.length >= 3) break;
    }
    
    // If not enough on same day, check next few days
    if (alternatives.length < 3) {
      for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + dayOffset);
        const nextDateStr = nextDate.toISOString().split('T')[0];
        
        const dayHours = getZoneHours(zone, nextDate.getDay());
        if (dayHours.length === 0) continue;
        
        for (const hour of dayHours.slice(0, 2)) {
          const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
          
          const { data: conflicts } = await supabase
            .from('appointments')
            .select('id')
            .eq('scheduled_date', nextDateStr)
            .eq('scheduled_time', timeSlot)
            .eq('status', 'scheduled');
          
          if (!conflicts || conflicts.length === 0) {
            alternatives.push({
              date: nextDateStr,
              time: timeSlot,
              zone: zone
            });
          }
          
          if (alternatives.length >= 3) break;
        }
        
        if (alternatives.length >= 3) break;
      }
    }
    
    return alternatives;
  } catch (error) {
    console.error('Error getting alternatives:', error);
    return [];
  }
}