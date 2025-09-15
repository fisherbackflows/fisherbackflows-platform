import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user || !['admin', 'technician'].includes(user.role)) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        appointments: [],
        count: 0
      }, { status: 401 });
    }

    console.log('🔍 Team appointments API: Fetching appointments for user:', user.email, 'role:', user.role);

    const supabase = createRouteHandlerClient(request);

    console.log('🔍 Team appointments API: Fetching appointments from database...');

    // Fetch real appointments from the database with correct relationship syntax
    const { data: appointments, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        customer:customers(
          first_name,
          last_name,
          company_name,
          phone,
          address_line1,
          city,
          state
        ),
        device:devices(
          device_type,
          manufacturer,
          model,
          location_description
        )
      `)
      .order('scheduled_date', { ascending: true });

    if (appointmentError) {
      console.error('Appointment database error:', appointmentError);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to load appointments',
        appointments: [],
        count: 0
      }, { status: 500 });
    }

    // Transform data to match team portal interface expectations
    const transformedAppointments = appointments?.map(appointment => {
      const customer = appointment.customer || {};
      const device = appointment.device || {};

      // Create customer name - prefer company name, fallback to individual name
      const customerName = customer.company_name ||
        `${customer.first_name || ''} ${customer.last_name || ''}`.trim() ||
        'Unknown Customer';

      // Map appointment type - map from database values to UI values
      let appointmentType = 'test'; // default
      if (appointment.appointment_type) {
        const type = appointment.appointment_type.toLowerCase();
        if (type.includes('repair')) appointmentType = 'repair';
        else if (type.includes('install')) appointmentType = 'installation';
        else if (type.includes('consult')) appointmentType = 'consultation';
      }

      // Estimate cost based on type
      const baseCost = appointmentType === 'test' ? 150 :
                       appointmentType === 'repair' ? 300 :
                       appointmentType === 'installation' ? 500 : 200;

      return {
        id: appointment.id,
        customerId: appointment.customer_id,
        customerName,
        customerPhone: customer.phone || 'No phone',
        address: customer.address_line1 || 'Address not available',
        city: customer.city || 'Unknown City',
        date: appointment.scheduled_date,
        time: appointment.scheduled_time_start || '09:00',
        duration: appointment.estimated_duration || 60,
        type: appointmentType,
        status: appointment.status || 'scheduled',
        notes: appointment.special_instructions || '',
        deviceCount: device ? 1 : 1, // Default to 1
        estimatedCost: baseCost,
        priority: appointment.priority || 'medium'
      };
    }) || [];

    console.log(`✅ Team appointments API: Successfully transformed ${transformedAppointments.length} appointments`);

    return NextResponse.json({ 
      success: true,
      appointments: transformedAppointments,
      count: transformedAppointments.length
    });
  } catch (error) {
    console.error('Team appointments API error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Server error',
      appointments: [],
      count: 0
    }, { status: 500 });
  }
}