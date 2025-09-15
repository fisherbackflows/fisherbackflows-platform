import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { sendBookingConfirmation } from '@/lib/email-notifications';

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Booking request schema
const BookingSchema = z.object({
  customerId: z.string().uuid(),
  deviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  zone: z.string().min(1),
  notes: z.string().optional()
});

// Rate limiting helper
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 5; // 5 requests per minute
  
  const current = rateLimitStore.get(identifier);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Too many booking requests. Please wait a minute and try again.' },
        { status: 429 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validatedData = BookingSchema.parse(body);
    
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
    
    // Start transaction-like behavior using database functions
    const bookingId = crypto.randomUUID();
    const bookingTimestamp = new Date().toISOString();
    
    // Check if slot is still available by looking for conflicts
    const conflictCheckTime = `${validatedData.date} ${validatedData.time}:00`;
    
    const { data: existingAppointments, error: conflictError } = await supabase
      .from('appointments')
      .select('id, scheduled_date, scheduled_time, notes')
      .eq('scheduled_date', validatedData.date)
      .eq('scheduled_time', validatedData.time)
      .eq('status', 'scheduled');
    
    if (conflictError) {
      console.error('Conflict check error:', conflictError);
      return NextResponse.json(
        { error: 'Unable to verify availability. Please try again.' },
        { status: 500 }
      );
    }
    
    // Check for zone conflicts (same time slot should be in same zone)
    const zoneConflicts = existingAppointments?.filter(apt => {
      const existingZone = apt.notes?.includes('North Puyallup') ? 'North Puyallup' : 'South Puyallup';
      return existingZone !== validatedData.zone;
    });
    
    if (existingAppointments && existingAppointments.length > 0) {
      return NextResponse.json(
        { 
          error: 'This time slot has already been booked. Please select a different time.',
          conflictDetails: {
            existingBookings: existingAppointments.length,
            suggestedAlternatives: await getSuggestedAlternatives(supabase, validatedData.date, validatedData.zone)
          }
        },
        { status: 409 }
      );
    }
    
    // Verify customer exists and get device info
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name, email, phone')
      .eq('id', validatedData.customerId)
      .single();
    
    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found. Please log in and try again.' },
        { status: 404 }
      );
    }
    
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, location, device_type, serial_number')
      .eq('id', validatedData.deviceId)
      .eq('customer_id', validatedData.customerId)
      .single();
    
    if (deviceError || !device) {
      return NextResponse.json(
        { error: 'Device not found or does not belong to this customer.' },
        { status: 404 }
      );
    }
    
    // Create the appointment with atomic operation
    const appointmentData = {
      id: bookingId,
      customer_id: validatedData.customerId,
      device_id: validatedData.deviceId,
      scheduled_date: validatedData.date,
      scheduled_time: validatedData.time,
      status: 'scheduled',
      service_type: 'Annual Backflow Test',
      notes: `${validatedData.notes || ''} - Scheduled for ${validatedData.zone} zone via customer portal`,
      created_at: bookingTimestamp,
      updated_at: bookingTimestamp
    };
    
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();
    
    if (appointmentError) {
      console.error('Appointment creation error:', appointmentError);
      
      // Check if this was a duplicate key error (race condition)
      if (appointmentError.message?.includes('duplicate') || appointmentError.code === '23505') {
        return NextResponse.json(
          { 
            error: 'This time slot was just booked by another customer. Please select a different time.',
            suggestedAlternatives: await getSuggestedAlternatives(supabase, validatedData.date, validatedData.zone)
          },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create appointment. Please try again.' },
        { status: 500 }
      );
    }
    
    // Log the successful booking for audit trail
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'appointments',
        record_id: bookingId,
        action: 'INSERT',
        old_values: null,
        new_values: appointmentData,
        user_id: validatedData.customerId,
        timestamp: bookingTimestamp
      });
    
    // Send confirmation email
    try {
      await sendBookingConfirmation({
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        appointmentId: appointment.id,
        appointmentDate: appointment.scheduled_date,
        appointmentTime: appointment.scheduled_time,
        deviceLocation: device.location,
        deviceType: device.device_type,
        zone: validatedData.zone,
        notes: validatedData.notes
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the booking if email fails
    }
    
    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        date: appointment.scheduled_date,
        time: appointment.scheduled_time,
        zone: validatedData.zone,
        device: {
          location: device.location,
          type: device.device_type,
          serial: device.serial_number
        },
        customer: {
          name: customer.name,
          email: customer.email
        }
      },
      message: 'Appointment booked successfully! You will receive a confirmation email shortly.'
    });
    
  } catch (error) {
    console.error('Booking API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid booking data provided.',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
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
    for (const hour of getZoneHours(zone, date.getDay())) {
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
        
        const hours = getZoneHours(zone, nextDate.getDay());
        if (hours.length === 0) continue;
        
        for (const hour of hours.slice(0, 2)) {
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

// Helper to get available hours for a zone/day
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