import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient(request);
    const appointmentId = params.id;

    // Get appointment with customer and device details
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone,
          address
        ),
        devices (
          id,
          serial_number,
          size,
          make,
          model,
          location,
          last_test_date
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (error || !appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Transform data for field app
    const transformedAppointment = {
      id: appointment.id,
      customerId: appointment.customer_id,
      customerName: appointment.customers?.name || 'Unknown Customer',
      customerPhone: appointment.customers?.phone || '',
      customer: appointment.customers,
      serviceType: appointment.service_type || 'Annual Test',
      date: appointment.appointment_date,
      appointment_date: appointment.appointment_date,
      time: appointment.appointment_time,
      appointment_time: appointment.appointment_time,
      duration: appointment.duration || 60,
      status: appointment.status,
      deviceLocation: appointment.device_location || appointment.customers?.address || '',
      device_location: appointment.device_location || appointment.customers?.address || '',
      notes: appointment.notes || '',
      technician: appointment.technician || 'Mike Fisher',
      createdDate: appointment.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      device_id: appointment.device_id,
      device: appointment.devices ? {
        id: appointment.devices.id,
        serialNumber: appointment.devices.serial_number,
        serial_number: appointment.devices.serial_number,
        size: appointment.devices.size,
        make: appointment.devices.make,
        model: appointment.devices.model,
        location: appointment.devices.location,
        lastTestDate: appointment.devices.last_test_date,
        last_test_date: appointment.devices.last_test_date
      } : null
    };

    return NextResponse.json({
      success: true,
      appointment: transformedAppointment
    });

  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointment' },
      { status: 500 }
    );
  }
}

// Update appointment status, notes, etc.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient(request);
    const appointmentId = params.id;
    const updateData = await request.json();

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to update appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      appointment: data
    });

  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}