import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';
import { validateSession } from '@/lib/auth-security';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Use team portal session authentication
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('team_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ 
        success: false,
        error: 'Not authenticated',
        appointments: [],
        count: 0
      }, { status: 401 });
    }

    const sessionValidation = await validateSession(sessionToken);
    if (!sessionValidation.isValid) {
      return NextResponse.json({ 
        success: false,
        error: 'Session expired',
        appointments: [],
        count: 0
      }, { status: 401 });
    }

    const supabase = supabaseAdmin || createRouteHandlerClient(request);
    
    console.log('🔍 Tester Portal: Fetching appointments from database...');
    
    // Fetch real appointments from the database
    const { data: appointments, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        customers:customer_id(
          first_name,
          last_name,
          company_name,
          phone,
          street_address,
          city,
          state
        ),
        devices:devices(
          device_type,
          device_status
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
    const transformedAppointments = appointments?.map(appointment => ({
      id: appointment.id,
      customerId: appointment.customer_id,
      customerName: appointment.customers?.company_name || 
                   `${appointment.customers?.first_name} ${appointment.customers?.last_name}`,
      customerPhone: appointment.customers?.phone || '',
      address: appointment.customers?.street_address || '',
      city: appointment.customers?.city || '',
      date: appointment.scheduled_date?.split('T')[0] || '',
      time: appointment.scheduled_time || '',
      duration: appointment.duration_minutes || 60,
      type: appointment.appointment_type || 'test',
      status: appointment.status || 'scheduled',
      notes: appointment.notes || '',
      deviceCount: appointment.devices?.length || 1,
      estimatedCost: appointment.estimated_cost || 0,
      priority: appointment.priority || 'medium'
    })) || [];

    console.log(`📊 Tester Portal: Loaded ${transformedAppointments.length} real appointments`);

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