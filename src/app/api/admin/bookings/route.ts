import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const zone = searchParams.get('zone');
    const dateRange = searchParams.get('dateRange');
    const search = searchParams.get('search');

    // Build the query
    let query = supabase
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
          device_type
        )
      `)
      .order('scheduled_date', { ascending: false })
      .order('scheduled_time', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply date range filter
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      
      if (dateRange === 'today') {
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        query = query
          .gte('scheduled_date', today.toISOString().split('T')[0])
          .lt('scheduled_date', tomorrow.toISOString().split('T')[0]);
      } else if (dateRange === 'week') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = query.gte('scheduled_date', weekAgo.toISOString().split('T')[0]);
      } else if (dateRange === 'month') {
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        query = query.gte('scheduled_date', monthAgo.toISOString().split('T')[0]);
      }
    }

    const { data: appointments, error: appointmentsError } = await query;

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const transformedBookings = (appointments || []).map(appointment => {
      // Extract zone from notes or determine from date
      let zone = '';
      if (appointment.notes?.includes('North Puyallup')) {
        zone = 'North Puyallup';
      } else if (appointment.notes?.includes('South Puyallup')) {
        zone = 'South Puyallup';
      } else if (appointment.scheduled_date) {
        // Determine zone based on day of week (fallback)
        const dayOfWeek = new Date(appointment.scheduled_date).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 1 || dayOfWeek === 2) {
          zone = 'North Puyallup';
        } else if (dayOfWeek >= 3 && dayOfWeek <= 5) {
          zone = 'South Puyallup';
        }
      }

      return {
        id: appointment.id,
        customer_id: appointment.customer_id,
        customer_name: (Array.isArray(appointment.customers) ? (appointment.customers as any[])[0]?.name : (appointment.customers as any)?.name) || 'Unknown',
        customer_email: (Array.isArray(appointment.customers) ? (appointment.customers as any[])[0]?.email : (appointment.customers as any)?.email) || '',
        customer_phone: (Array.isArray(appointment.customers) ? (appointment.customers as any[])[0]?.phone : (appointment.customers as any)?.phone) || '',
        device_id: appointment.device_id,
        device_location: (Array.isArray(appointment.devices) ? (appointment.devices as any[])[0]?.location : (appointment.devices as any)?.location) || 'Unknown location',
        device_type: (Array.isArray(appointment.devices) ? (appointment.devices as any[])[0]?.device_type : (appointment.devices as any)?.device_type) || 'Unknown device',
        scheduled_date: appointment.scheduled_date,
        scheduled_time: appointment.scheduled_time,
        status: appointment.status,
        service_type: appointment.service_type || 'Backflow Test',
        zone: zone,
        notes: appointment.notes,
        created_at: appointment.created_at,
        updated_at: appointment.updated_at
      };
    });

    // Apply search filter on transformed data
    let filteredBookings = transformedBookings;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredBookings = transformedBookings.filter(booking =>
        booking.customer_name.toLowerCase().includes(searchLower) ||
        booking.customer_email.toLowerCase().includes(searchLower) ||
        booking.device_location.toLowerCase().includes(searchLower) ||
        (booking.customer_phone && booking.customer_phone.includes(search))
      );
    }

    // Apply zone filter
    if (zone && zone !== 'all') {
      filteredBookings = filteredBookings.filter(booking => booking.zone === zone);
    }

    // Calculate statistics
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const stats = {
      total: filteredBookings.length,
      scheduled: filteredBookings.filter(b => b.status === 'scheduled').length,
      confirmed: filteredBookings.filter(b => b.status === 'confirmed').length,
      completed: filteredBookings.filter(b => b.status === 'completed').length,
      cancelled: filteredBookings.filter(b => b.status === 'cancelled').length,
      todayCount: filteredBookings.filter(b => {
        const bookingDate = new Date(b.scheduled_date);
        return bookingDate >= today && bookingDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
      }).length,
      weekCount: filteredBookings.filter(b => {
        const bookingDate = new Date(b.scheduled_date);
        return bookingDate >= weekAgo;
      }).length
    };

    return NextResponse.json({
      success: true,
      bookings: filteredBookings,
      stats: stats,
      total: filteredBookings.length
    });

  } catch (error) {
    console.error('Admin bookings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}