import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { google } from 'googleapis';

export interface Appointment {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  serviceType: string
  date: string
  time: string
  duration: number
  status: 'Scheduled' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled'
  deviceLocation?: string
  notes?: string
  technician?: string
  createdDate: string
}

// Google Calendar setup
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const CALENDAR_ID = 'fisherbackflows@gmail.com';

async function createCalendarEvent(appointment: any) {
  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
      console.log('Google Calendar not configured, skipping event creation');
      return;
    }

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      refresh_token: GOOGLE_REFRESH_TOKEN
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Parse date and time
    const [hour, minute] = appointment.time.split(':');
    const startDateTime = new Date(appointment.date);
    startDateTime.setHours(parseInt(hour), parseInt(minute), 0, 0);
    
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + appointment.duration);

    const event = {
      summary: `${appointment.serviceType} - ${appointment.customerName}`,
      description: `Customer: ${appointment.customerName}\nPhone: ${appointment.customerPhone}\nLocation: ${appointment.deviceLocation}\nNotes: ${appointment.notes}`,
      location: appointment.deviceLocation,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/Los_Angeles',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/Los_Angeles',
      },
      attendees: [
        { email: CALENDAR_ID }
      ],
    };

    const result = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: event,
    });

    return result.data.id;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return null;
  }
}

// Mock appointment data for fallback
const mockAppointments: Appointment[] = [
  {
    id: '1',
    customerId: '1',
    customerName: 'John Smith',
    customerPhone: '555-0123',
    serviceType: 'Annual Test',
    date: '2025-01-15',
    time: '10:00',
    duration: 60,
    status: 'Scheduled',
    deviceLocation: '123 Main St - Backyard',
    notes: 'Call before arrival',
    technician: 'Mike Fisher',
    createdDate: '2024-12-20'
  }
]

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request);
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    
    // Try to get from database, fallback to mock data
    let appointments;
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          customers (
            id,
            name,
            phone,
            address
          )
        `)
        .order('appointment_date', { ascending: true });

      if (error) throw error;

      appointments = data?.map(apt => ({
        id: apt.id,
        customerId: apt.customer_id,
        customerName: apt.customers?.name || 'Unknown',
        customerPhone: apt.customers?.phone || '',
        serviceType: apt.service_type,
        date: apt.appointment_date,
        time: apt.appointment_time,
        duration: apt.duration || 60,
        status: apt.status,
        deviceLocation: apt.device_location || apt.customers?.address || '',
        notes: apt.notes || '',
        technician: apt.technician || 'Mike Fisher',
        createdDate: apt.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
      })) || [];
    } catch (dbError) {
      console.error('Database error, using mock data:', dbError);
      appointments = mockAppointments;
    }
    
    // Filter by customer ID
    if (customerId) {
      appointments = appointments.filter((appointment: any) =>
        appointment.customerId === customerId
      )
    }
    
    // Filter by date
    if (date) {
      appointments = appointments.filter((appointment: any) =>
        appointment.date === date
      )
    }
    
    // Filter by status
    if (status && status !== 'All') {
      appointments = appointments.filter((appointment: any) =>
        appointment.status === status
      )
    }
    
    return NextResponse.json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch appointments',
        appointments: mockAppointments 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request);
    const data = await request.json()
    
    // Validate required fields
    if (!data.customerId || !data.serviceType || !data.date || !data.time) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get customer info first
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', data.customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Check for scheduling conflicts in database
    const { data: conflicts, error: conflictError } = await supabase
      .from('appointments')
      .select('*')
      .eq('appointment_date', data.date)
      .eq('appointment_time', data.time)
      .neq('status', 'Cancelled');

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError);
    }

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Time slot already booked' },
        { status: 409 }
      )
    }

    // Prepare appointment data
    const appointmentData = {
      customer_id: data.customerId,
      service_type: data.serviceType || 'Annual Test',
      appointment_date: data.date,
      appointment_time: data.time,
      duration: data.duration || 60,
      status: 'Scheduled' as const,
      device_location: data.deviceLocation || customer.address,
      notes: data.notes || '',
      technician: data.technician || 'Mike Fisher'
    };

    // Create appointment in database
    const { data: newAppointment, error } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select(`
        *,
        customers (
          id,
          name,
          phone,
          address
        )
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create appointment' },
        { status: 500 }
      )
    }

    // Create Google Calendar event
    const calendarEventId = await createCalendarEvent({
      ...appointmentData,
      customerName: customer.name,
      customerPhone: customer.phone,
      deviceLocation: appointmentData.device_location
    });

    // Transform response for frontend
    const transformedAppointment = {
      id: newAppointment.id,
      customerId: newAppointment.customer_id,
      customerName: customer.name,
      customerPhone: customer.phone,
      serviceType: newAppointment.service_type,
      date: newAppointment.appointment_date,
      time: newAppointment.appointment_time,
      duration: newAppointment.duration,
      status: newAppointment.status,
      deviceLocation: newAppointment.device_location,
      notes: newAppointment.notes,
      technician: newAppointment.technician,
      createdDate: newAppointment.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
    };

    // Auto-update next test date for customer devices
    if (data.serviceType === 'Annual Test') {
      const nextTestDate = new Date(data.date);
      nextTestDate.setFullYear(nextTestDate.getFullYear() + 1);

      // Update devices and customer next test date
      await Promise.all([
        supabase
          .from('devices')
          .update({ next_test_date: nextTestDate.toISOString().split('T')[0] })
          .eq('customer_id', data.customerId),
        supabase
          .from('customers')
          .update({ next_test_date: nextTestDate.toISOString().split('T')[0] })
          .eq('id', data.customerId)
      ]);
    }

    return NextResponse.json({
      success: true,
      appointment: transformedAppointment,
      calendarEventId: calendarEventId || 'Not configured'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
}