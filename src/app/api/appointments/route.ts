import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { createRouteHandlerClient } from '@/lib/supabase';
import { auth } from '@/lib/auth';

export interface Appointment {
  id: string
  customer_id: string
  device_id?: string
  assigned_technician?: string
  appointment_type: string
  scheduled_date: string
  scheduled_time_start: string
  scheduled_time_end?: string
  actual_start_time?: string
  actual_end_time?: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  estimated_duration?: number
  travel_time?: number
  special_instructions?: string
  customer_notes?: string
  technician_notes?: string
  completion_notes?: string
  customer_can_track?: boolean
  estimated_arrival?: string
  travel_distance_km?: number
  company_id?: string
  created_at: string
  updated_at: string
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Appointments API: Starting auth check...');
    const user = await auth.getApiUser(request);
    console.log('👤 Appointments API: Auth result:', { user: user ? 'found' : 'null', role: user?.role });
    if (!user) {
      console.log('❌ Appointments API: No user found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createRouteHandlerClient(request);

    console.log('🔍 Fetching appointments from database...');

    // Try complex query with customer data first
    let { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        customer:customers(first_name, last_name, email, phone, company_name),
        device:devices(device_type, manufacturer, model, location_description)
      `)
      .order('scheduled_date', { ascending: true });

    // If complex query fails, try simple query
    if (error) {
      console.log('⚠️ Complex query failed, trying simple query:', error.message);

      const simpleResult = await supabase
        .from('appointments')
        .select('*')
        .order('scheduled_date', { ascending: true });

      appointments = simpleResult.data as any; // Type assertion for fallback query
      error = simpleResult.error;
    }

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({
        error: 'Failed to fetch appointments',
        details: error.message
      }, { status: 500 });
    }

    console.log(`✅ Successfully fetched ${appointments?.length || 0} appointments`);

    return NextResponse.json({
      success: true,
      appointments: appointments || [],
      count: appointments?.length || 0
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📅 Creating appointment for user:', user.email, 'role:', user.role);

    const body = await request.json();
    console.log('📍 Received appointment data:', body);

    // Extract and normalize input fields
    const {
      customerId,
      customer_id,
      serviceType,
      appointment_type,
      date,
      scheduled_date,
      time,
      timeSlot,
      scheduled_time_start,
      duration,
      estimated_duration,
      deviceId,
      device_id,
      deviceLocation,
      notes,
      specialInstructions,
      special_instructions,
      priority,
      travel_time
    } = body;

    // Support multiple field name formats for flexibility
    const finalCustomerId = customerId || customer_id;
    const finalAppointmentType = serviceType || appointment_type || 'Annual Test';
    const finalDate = date || scheduled_date;
    const finalTime = time || timeSlot || scheduled_time_start;
    const finalDuration = duration || estimated_duration || 60;
    const finalDeviceId = deviceId || device_id || null;
    const finalInstructions = notes || specialInstructions || special_instructions || null;
    const finalPriority = priority || 'normal';
    const finalTravelTime = travel_time || 15;

    console.log('📍 Normalized appointment data:', {
      customerId: finalCustomerId,
      appointmentType: finalAppointmentType,
      date: finalDate,
      time: finalTime,
      duration: finalDuration
    });

    // Validate required fields
    if (!finalTime) {
      return NextResponse.json({
        success: false,
        error: 'Appointment time is required'
      }, { status: 400 });
    }

    if (!finalDate) {
      return NextResponse.json({
        success: false,
        error: 'Appointment date is required'
      }, { status: 400 });
    }

    const supabase = createRouteHandlerClient(request);

    // For customer users, ensure they can only create appointments for themselves
    let targetCustomerId = finalCustomerId;
    if (user.role === 'customer') {
      // For customer portal API, we need to get their customer record ID
      const { data: customerRecord } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single();

      if (customerRecord) {
        targetCustomerId = customerRecord.id;
      } else {
        targetCustomerId = user.id; // Fallback to user ID
      }
    }

    // Prepare appointment data matching database schema exactly
    const appointmentData = {
      customer_id: targetCustomerId,
      device_id: finalDeviceId,
      appointment_type: finalAppointmentType,
      scheduled_date: finalDate,
      scheduled_time_start: finalTime,
      status: 'scheduled',
      priority: finalPriority,
      estimated_duration: finalDuration,
      travel_time: finalTravelTime,
      special_instructions: finalInstructions,
      customer_can_track: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📍 Final database appointment data:', appointmentData);

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select(`
        *,
        customer:customers(first_name, last_name, email, phone, company_name),
        device:devices(device_type, manufacturer, model, location_description)
      `)
      .single();

    if (error) {
      console.error('❌ Database error creating appointment:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create appointment',
        details: error.message
      }, { status: 500 });
    }

    console.log('✅ Appointment created successfully:', appointment.id);

    return NextResponse.json({
      success: true,
      appointment,
      message: 'Appointment created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ API error creating appointment:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, appointmentId, ...updateData } = body;
    const targetId = id || appointmentId;

    if (!targetId) {
      return NextResponse.json({
        success: false,
        error: 'Appointment ID is required'
      }, { status: 400 });
    }

    console.log('📅 Updating appointment:', targetId, 'for user:', user.email);

    const supabase = createRouteHandlerClient(request);

    // First, verify the appointment exists and user has permission
    const { data: existingAppointment } = await supabase
      .from('appointments')
      .select('id, customer_id')
      .eq('id', targetId)
      .single();

    if (!existingAppointment) {
      return NextResponse.json({
        success: false,
        error: 'Appointment not found'
      }, { status: 404 });
    }

    // For customers, ensure they can only update their own appointments
    if (user.role === 'customer') {
      const { data: customerRecord } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single();

      if (customerRecord && existingAppointment.customer_id !== customerRecord.id) {
        return NextResponse.json({
          success: false,
          error: 'Permission denied'
        }, { status: 403 });
      }
    }

    // Prepare update data
    const appointmentUpdateData = {
      ...updateData,
      updated_at: new Date().toISOString()
    };

    // Remove any fields that shouldn't be updated
    delete appointmentUpdateData.id;
    delete appointmentUpdateData.created_at;

    const { data: updatedAppointment, error } = await supabase
      .from('appointments')
      .update(appointmentUpdateData)
      .eq('id', targetId)
      .select(`
        *,
        customer:customers(first_name, last_name, email, phone, company_name),
        device:devices(device_type, manufacturer, model, location_description)
      `)
      .single();

    if (error) {
      console.error('❌ Database error updating appointment:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update appointment',
        details: error.message
      }, { status: 500 });
    }

    console.log('✅ Appointment updated successfully:', updatedAppointment.id);

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
      message: 'Appointment updated successfully'
    });

  } catch (error) {
    console.error('❌ API error updating appointment:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('id');

    if (!appointmentId) {
      return NextResponse.json({
        success: false,
        error: 'Appointment ID is required'
      }, { status: 400 });
    }

    console.log('🗑️ Deleting appointment:', appointmentId, 'for user:', user.email);

    const supabase = createRouteHandlerClient(request);

    // First, verify the appointment exists and user has permission
    const { data: existingAppointment } = await supabase
      .from('appointments')
      .select('id, customer_id, status')
      .eq('id', appointmentId)
      .single();

    if (!existingAppointment) {
      return NextResponse.json({
        success: false,
        error: 'Appointment not found'
      }, { status: 404 });
    }

    // For customers, ensure they can only delete their own appointments
    if (user.role === 'customer') {
      const { data: customerRecord } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single();

      if (customerRecord && existingAppointment.customer_id !== customerRecord.id) {
        return NextResponse.json({
          success: false,
          error: 'Permission denied'
        }, { status: 403 });
      }

      // Customers can only cancel appointments that haven't started
      if (existingAppointment.status && ['in_progress', 'completed'].includes(existingAppointment.status)) {
        return NextResponse.json({
          success: false,
          error: 'Cannot delete appointment that has already started or been completed'
        }, { status: 400 });
      }
    }

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);

    if (error) {
      console.error('❌ Database error deleting appointment:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to delete appointment',
        details: error.message
      }, { status: 500 });
    }

    console.log('✅ Appointment deleted successfully:', appointmentId);

    return NextResponse.json({
      success: true,
      message: 'Appointment deleted successfully'
    });

  } catch (error) {
    console.error('❌ API error deleting appointment:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
}