import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';

async function checkPermissions(request: NextRequest) {
  const cookies = request.cookies;
  const teamSession = cookies.get('team_session')?.value;
  
  if (!teamSession) {
    return { hasAccess: false, isOwner: false, user: null };
  }
  
  try {
    const { data: session } = await supabaseAdmin
      .from('team_sessions')
      .select(`
        team_user_id,
        expires_at,
        team_users (
          id, email, role, is_active
        )
      `)
      .eq('session_token', teamSession)
      .gt('expires_at', new Date().toISOString())
      .single();
      
    if (!session?.team_users) {
      return { hasAccess: false, isOwner: false, user: null };
    }
    
    const user = session.team_users as any;
    const isOwner = user.email === 'blake@fisherbackflows.com' || user.role === 'admin';
    
    return { hasAccess: true, isOwner, user };
  } catch (error) {
    return { hasAccess: false, isOwner: false, user: null };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { hasAccess, user } = await checkPermissions(request);
    
    if (!hasAccess) {
      return NextResponse.json({ 
        success: false,
        error: 'Access denied - requires scheduling subscription' 
      }, { status: 403 });
    }
    
    // Get appointments from database
    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        id,
        customer_id,
        scheduled_date,
        scheduled_time,
        duration_minutes,
        appointment_type,
        status,
        notes,
        estimated_cost,
        priority,
        customers (
          id,
          name,
          email,
          phone,
          address,
          city
        )
      `)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch appointments'
      }, { status: 500 });
    }

    // Transform data to match frontend interface
    const transformedAppointments = (appointments || []).map(apt => ({
      id: apt.id,
      customerId: apt.customer_id,
      customerName: apt.customers?.name || 'Unknown Customer',
      customerPhone: apt.customers?.phone || '',
      address: apt.customers?.address || '',
      city: apt.customers?.city || '',
      date: apt.scheduled_date,
      time: apt.scheduled_time,
      duration: apt.duration_minutes || 60,
      type: apt.appointment_type || 'test',
      status: apt.status || 'scheduled',
      notes: apt.notes || '',
      deviceCount: 1, // Default - could be enhanced
      estimatedCost: apt.estimated_cost || 0,
      priority: apt.priority || 'medium'
    }));
    
    return NextResponse.json({
      success: true,
      appointments: transformedAppointments
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { hasAccess, user } = await checkPermissions(request);
    
    if (!hasAccess) {
      return NextResponse.json({ 
        success: false,
        error: 'Access denied - requires scheduling subscription' 
      }, { status: 403 });
    }
    
    const body = await request.json();
    const {
      customer_id,
      scheduled_date,
      scheduled_time,
      duration_minutes,
      appointment_type,
      notes,
      estimated_cost,
      priority
    } = body;
    
    // Create new appointment
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .insert({
        customer_id,
        scheduled_date,
        scheduled_time,
        duration_minutes: duration_minutes || 60,
        appointment_type: appointment_type || 'test',
        status: 'scheduled',
        notes: notes || '',
        estimated_cost: estimated_cost || 0,
        priority: priority || 'medium',
        created_by: user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create appointment'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      appointment,
      message: 'Appointment created successfully'
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { hasAccess, user } = await checkPermissions(request);
    
    if (!hasAccess) {
      return NextResponse.json({ 
        success: false,
        error: 'Access denied - requires scheduling subscription' 
      }, { status: 403 });
    }
    
    const body = await request.json();
    const { id, status, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Appointment ID required'
      }, { status: 400 });
    }
    
    // Update appointment
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .update({
        ...updateData,
        ...(status && { status }),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update appointment'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      appointment,
      message: 'Appointment updated successfully'
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
