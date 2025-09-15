import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    
    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

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

    // First, get the appointment data for audit log
    const { data: appointmentData, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError) {
      console.error('Error fetching appointment:', fetchError);
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Delete the appointment
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('id', bookingId);

    if (deleteError) {
      console.error('Error deleting appointment:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete appointment' },
        { status: 500 }
      );
    }

    // Log the deletion for audit trail
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'appointments',
        record_id: bookingId,
        action: 'DELETE',
        old_values: appointmentData,
        new_values: null,
        user_id: 'admin', // In a real implementation, get this from auth
        timestamp: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      message: 'Appointment deleted successfully'
    });

  } catch (error) {
    console.error('Delete appointment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    
    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

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

    // Get the appointment with related data
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        id,
        customer_id,
        device_id,
        scheduled_date,
        scheduled_time,
        status,
        service_type,
        notes,
        created_at,
        updated_at,
        customers!customer_id (
          name,
          email,
          phone
        ),
        devices!device_id (
          location,
          device_type,
          serial_number
        )
      `)
      .eq('id', bookingId)
      .single();

    if (error) {
      console.error('Error fetching appointment:', error);
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Transform the data
    const transformedBooking = {
      id: appointment.id,
      customer_id: appointment.customer_id,
      customer_name: (Array.isArray(appointment.customers) ? appointment.customers[0]?.name : appointment.customers?.name) || 'Unknown',
      customer_email: (Array.isArray(appointment.customers) ? appointment.customers[0]?.email : appointment.customers?.email) || '',
      customer_phone: (Array.isArray(appointment.customers) ? appointment.customers[0]?.phone : appointment.customers?.phone) || '',
      device_id: appointment.device_id,
      device_location: (Array.isArray(appointment.devices) ? appointment.devices[0]?.location : appointment.devices?.location) || 'Unknown location',
      device_type: (Array.isArray(appointment.devices) ? appointment.devices[0]?.device_type : appointment.devices?.device_type) || 'Unknown device',
      device_serial: (Array.isArray(appointment.devices) ? appointment.devices[0]?.serial_number : appointment.devices?.serial_number) || '',
      scheduled_date: appointment.scheduled_date,
      scheduled_time: appointment.scheduled_time,
      status: appointment.status,
      service_type: appointment.service_type || 'Backflow Test',
      notes: appointment.notes,
      created_at: appointment.created_at,
      updated_at: appointment.updated_at
    };

    return NextResponse.json({
      success: true,
      booking: transformedBooking
    });

  } catch (error) {
    console.error('Get appointment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}