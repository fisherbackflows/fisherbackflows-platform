import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
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
    const user = await auth.getApiUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createRouteHandlerClient(request);
    
    // Try complex query first, fallback to simple query if it fails
    let appointments, error;
    
    try {
      const result = await supabase
        .from('appointments')
        .select(`
          *,
          customer:customers(first_name, last_name, email, phone, company_name),
          device:devices(device_type, size_inches, location_description),
          technician:team_users(first_name, last_name, email)
        `)
        .order('scheduled_date', { ascending: true });
      
      appointments = result.data;
      error = result.error;
    } catch (joinError) {
      console.log('Complex query failed, trying simple query:', joinError);
      
      // Fallback to simple query
      const result = await supabase
        .from('appointments')
        .select('*')
        .order('scheduled_date', { ascending: true });
      
      appointments = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Database error:', error);
      
      // Return mock appointments data for development
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

    return NextResponse.json({ 
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
    if (!user || !['admin', 'technician'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const supabase = createRouteHandlerClient(request);
    
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}