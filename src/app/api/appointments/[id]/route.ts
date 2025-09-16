import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { createRouteHandlerClient } from '@/lib/supabase';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await auth.getApiUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createRouteHandlerClient(request);
    const { id: appointmentId } = await params;

    console.log('🔍 Individual appointment API: Fetching appointment', appointmentId, 'for user:', user.email);

    // Get appointment with customer and device details
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        customers (
          id,
          first_name,
          last_name,
          email,
          phone,
          address_line1,
          address_line2,
          city,
          state,
          zip_code
        ),
        devices (
          id,
          serial_number,
          size_inches,
          manufacturer,
          model,
          location_description,
          last_test_date
        )
      `)
      .eq('id', appointmentId)
      .single() as { data: any; error: any };

    if (error || !appointment) {
      return NextResponse.json(
        { success: false, error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Format customer address
    const formatCustomerAddress = (customer: any) => {
      if (!customer) return '';
      const parts = [
        customer.address_line1,
        customer.address_line2,
        customer.city,
        customer.state,
        customer.zip_code
      ].filter(Boolean);
      return parts.join(', ');
    };

    // Transform data for field app
    const transformedAppointment = {
      id: appointment.id,
      customerId: appointment.customer_id,
      customerName: appointment.customers 
        ? `${appointment.customers.first_name} ${appointment.customers.last_name}`.trim() 
        : 'Unknown Customer',
      customerPhone: appointment.customers?.phone || '',
      customerEmail: appointment.customers?.email || '',
      customer: appointment.customers,
      serviceType: appointment.appointment_type || 'Annual Test',
      date: appointment.scheduled_date,
      appointment_date: appointment.scheduled_date,
      time: appointment.scheduled_time_start,
      appointment_time: appointment.scheduled_time_start,
      duration: appointment.estimated_duration || 60,
      status: appointment.status,
      deviceLocation: appointment.special_instructions || formatCustomerAddress(appointment.customers),
      device_location: appointment.special_instructions || formatCustomerAddress(appointment.customers),
      address: formatCustomerAddress(appointment.customers),
      notes: appointment.customer_notes || appointment.technician_notes || '',
      technician: appointment.assigned_technician || 'Mike Fisher',
      createdDate: appointment.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      device_id: appointment.device_id,
      device: appointment.devices ? {
        id: appointment.devices.id,
        serialNumber: appointment.devices.serial_number || 'Unknown',
        serial_number: appointment.devices.serial_number || 'Unknown', 
        size: appointment.devices.size_inches || '3/4"',
        make: appointment.devices.manufacturer || 'Unknown',
        manufacturer: appointment.devices.manufacturer || 'Unknown',
        model: appointment.devices.model || 'Unknown',
        location: appointment.devices.location_description || '',
        lastTestDate: appointment.devices.last_test_date || '2023-01-01',
        last_test_date: appointment.devices.last_test_date || '2023-01-01'
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient(request);
    const { id: appointmentId } = await params;
    const updateData: any = await request.json();

    const { data, error }: { data: any; error: any } = await supabase
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