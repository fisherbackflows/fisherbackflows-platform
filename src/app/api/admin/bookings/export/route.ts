import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Parse filters from request body
    const { filters } = await request.json();
    const { status, zone, dateRange, search } = filters || {};

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
          phone,
          address
        ),
        devices!device_id (
          location,
          device_type,
          serial_number,
          make,
          model
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
      console.error('Error fetching appointments for export:', appointmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    // Transform and filter the data
    let transformedBookings = (appointments || []).map(appointment => {
      // Extract zone from notes or determine from date
      let appointmentZone = '';
      if (appointment.notes?.includes('North Puyallup')) {
        appointmentZone = 'North Puyallup';
      } else if (appointment.notes?.includes('South Puyallup')) {
        appointmentZone = 'South Puyallup';
      } else if (appointment.scheduled_date) {
        const dayOfWeek = new Date(appointment.scheduled_date).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 1 || dayOfWeek === 2) {
          appointmentZone = 'North Puyallup';
        } else if (dayOfWeek >= 3 && dayOfWeek <= 5) {
          appointmentZone = 'South Puyallup';
        }
      }

      return {
        id: appointment.id,
        customer_name: (Array.isArray(appointment.customers) ? (appointment.customers as any[])[0]?.name : (appointment.customers as any)?.name) || 'Unknown',
        customer_email: (Array.isArray(appointment.customers) ? (appointment.customers as any[])[0]?.email : (appointment.customers as any)?.email) || '',
        customer_phone: (Array.isArray(appointment.customers) ? (appointment.customers as any[])[0]?.phone : (appointment.customers as any)?.phone) || '',
        customer_address: (Array.isArray(appointment.customers) ? (appointment.customers as any[])[0]?.address : (appointment.customers as any)?.address) || '',
        device_location: (Array.isArray(appointment.devices) ? (appointment.devices as any[])[0]?.location : (appointment.devices as any)?.location) || 'Unknown location',
        device_type: (Array.isArray(appointment.devices) ? (appointment.devices as any[])[0]?.device_type : (appointment.devices as any)?.device_type) || 'Unknown device',
        device_serial: (Array.isArray(appointment.devices) ? (appointment.devices as any[])[0]?.serial_number : (appointment.devices as any)?.serial_number) || '',
        device_make: (Array.isArray(appointment.devices) ? (appointment.devices as any[])[0]?.make : (appointment.devices as any)?.make) || '',
        device_model: (Array.isArray(appointment.devices) ? (appointment.devices as any[])[0]?.model : (appointment.devices as any)?.model) || '',
        scheduled_date: appointment.scheduled_date,
        scheduled_time: appointment.scheduled_time,
        status: appointment.status,
        service_type: appointment.service_type || 'Backflow Test',
        zone: appointmentZone,
        notes: appointment.notes,
        created_at: appointment.created_at,
        updated_at: appointment.updated_at
      };
    });

    // Apply additional filters
    if (search) {
      const searchLower = search.toLowerCase();
      transformedBookings = transformedBookings.filter(booking =>
        booking.customer_name.toLowerCase().includes(searchLower) ||
        booking.customer_email.toLowerCase().includes(searchLower) ||
        booking.device_location.toLowerCase().includes(searchLower) ||
        (booking.customer_phone && booking.customer_phone.includes(search))
      );
    }

    if (zone && zone !== 'all') {
      transformedBookings = transformedBookings.filter(booking => booking.zone === zone);
    }

    // Generate CSV content
    const headers = [
      'Booking ID',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Customer Address',
      'Device Type',
      'Device Location',
      'Device Serial',
      'Device Make',
      'Device Model',
      'Scheduled Date',
      'Scheduled Time',
      'Status',
      'Service Type',
      'Zone',
      'Notes',
      'Created At',
      'Updated At'
    ];

    const csvRows = [
      headers.join(','),
      ...transformedBookings.map(booking => [
        booking.id,
        `"${booking.customer_name.replace(/"/g, '""')}"`,
        `"${booking.customer_email.replace(/"/g, '""')}"`,
        `"${booking.customer_phone.replace(/"/g, '""')}"`,
        `"${booking.customer_address.replace(/"/g, '""')}"`,
        `"${booking.device_type.replace(/"/g, '""')}"`,
        `"${booking.device_location.replace(/"/g, '""')}"`,
        `"${booking.device_serial.replace(/"/g, '""')}"`,
        `"${booking.device_make.replace(/"/g, '""')}"`,
        `"${booking.device_model.replace(/"/g, '""')}"`,
        booking.scheduled_date,
        booking.scheduled_time,
        booking.status,
        `"${booking.service_type.replace(/"/g, '""')}"`,
        `"${booking.zone.replace(/"/g, '""')}"`,
        `"${(booking.notes || '').replace(/"/g, '""')}"`,
        new Date(booking.created_at).toISOString(),
        new Date(booking.updated_at).toISOString()
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');

    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="bookings-export-${new Date().toISOString().split('T')[0]}.csv"`,
        'Content-Length': csvContent.length.toString(),
      },
    });

  } catch (error) {
    console.error('Export bookings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}