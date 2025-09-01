import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/lib/auth';

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

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Appointments API: Starting auth check...');
    const user = await auth.getApiUser(request);
    console.log('👤 Appointments API: Auth result:', { user: user ? 'found' : 'null', role: user?.role });
    if (!user) {
      console.log('❌ Appointments API: No user found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseAdmin || createRouteHandlerClient(request);
    
    // Try complex query first, fallback to simple query if it fails
    let appointments, error;
    
    try {
      const result = await supabase
        .from('appointments')
        .select(`
          *,
          customer:customers(first_name, last_name, email, phone, company_name)
        `)
        .order('scheduled_date', { ascending: true });
      
      appointments = result.data;
      error = result.error;
      
      if (error) {
        console.log('Complex query failed, trying simple query:', error.message);
        
        // Fallback to simple query
        const simpleResult = await supabase
          .from('appointments')
          .select('*')
          .order('scheduled_date', { ascending: true });
        
        appointments = simpleResult.data;
        error = simpleResult.error;
      }
    } catch (joinError) {
      console.log('Query exception, trying simple query:', joinError);
      
      // Fallback to simple query
      const result = await supabase
        .from('appointments')
        .select('*')
        .order('scheduled_date', { ascending: true });
      
      appointments = result.data;
      error = result.error;
    }

    if (error && (!appointments || appointments.length === 0)) {
      console.error('Database error:', error);
      
      // Return mock appointments data for development only if no real data found
      
      const mockAppointments = [
        {
          id: 'apt-1',
          customer_id: 'cust-1',
          customer_name: 'John Smith',
          customer_phone: '(253) 555-0123',
          service_type: 'Backflow Test',
          scheduled_date: '2025-09-01',
          scheduled_time: '10:00',
          duration: 60,
          status: 'Scheduled',
          device_location: 'Front yard meter',
          notes: 'Residential backflow device test',
          technician_id: 'tech-1',
          created_at: new Date().toISOString()
        },
        {
          id: 'apt-2',
          customer_id: 'cust-2', 
          customer_name: 'ABC Restaurant',
          customer_phone: '(253) 555-0124',
          service_type: 'Commercial Test',
          scheduled_date: '2025-09-02',
          scheduled_time: '14:00',
          duration: 90,
          status: 'Confirmed',
          device_location: 'Kitchen backflow preventer',
          notes: 'Commercial kitchen device testing',
          technician_id: 'tech-1',
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];

      return NextResponse.json({ 
        appointments: mockAppointments,
        note: 'Using mock appointment data - appointments table needs setup',
        error: error.message
      });
    }

    // Always return appointments if we have them, even with errors from complex queries
    console.log(`Returning ${appointments?.length || 0} appointments`);
    if (appointments && appointments.length > 0) {
      console.log('Sample appointment from DB:', appointments[0]);
      return NextResponse.json({ 
        appointments: appointments,
        count: appointments.length,
        hasRealData: true
      });
    }
    
    return NextResponse.json({ 
      appointments: appointments || [],
      count: appointments?.length || 0,
      hasRealData: false
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
    
    // Allow customers to create their own appointments, admin/technician can create any appointments
    console.log('Creating appointment for user:', user.email, 'role:', user.role);

    const body = await request.json();
    const { customerId, serviceType, date, time, timeSlot, duration, deviceLocation, deviceInfo, notes, specialInstructions } = body;
    
    // Support both 'time' and 'timeSlot' field names for flexibility
    const appointmentTime = time || timeSlot;
    
    console.log('📍 Appointment API Debug:', {
      customerId,
      date,
      time,
      timeSlot,
      appointmentTime,
      serviceType
    });
    
    // Validate required fields
    if (!appointmentTime) {
      return NextResponse.json({
        success: false,
        error: 'Appointment time is required'
      }, { status: 400 });
    }
    
    if (!date) {
      return NextResponse.json({
        success: false,
        error: 'Appointment date is required'
      }, { status: 400 });
    }
    
    const supabase = createRouteHandlerClient(request);
    
    // For customer users, ensure they can only create appointments for themselves
    let finalCustomerId = customerId;
    if (user.role === 'customer') {
      finalCustomerId = user.id; // Use the authenticated user's ID
    }
    
    // Map frontend data to database schema
    const appointmentData = {
      customer_id: finalCustomerId,
      appointment_type: serviceType || 'annual_test',
      scheduled_date: date,
      scheduled_time_start: appointmentTime,
      estimated_duration: duration || 60,
      special_instructions: notes || specialInstructions || deviceInfo,
      status: 'scheduled',
      created_at: new Date().toISOString()
    };
    
    console.log('📍 Final appointment data for database:', appointmentData);
    
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select(`
        *,
        customer:customers(first_name, last_name, email, phone)
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to create appointment: ' + error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      appointment: appointment,
      message: 'Appointment created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}