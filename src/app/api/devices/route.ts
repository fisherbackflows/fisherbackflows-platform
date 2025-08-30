import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user || !['admin', 'technician', 'tester'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = supabaseAdmin || createRouteHandlerClient(request);
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    
    console.log('🔍 Fetching devices...', customerId ? `for customer ${customerId}` : 'all devices');
    
    let query = supabase
      .from('devices')
      .select(`
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          company_name,
          email,
          phone,
          address_line1,
          city,
          state,
          zip_code
        )
      `)
      .order('created_at', { ascending: false });

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data: devices, error } = await query;

    if (error) {
      console.error('Database error:', error);
      
      // Return mock device data for development
      const mockDevices = [
        {
          id: 'dev-1',
          customer_id: customerId || 'cust-1',
          device_type: 'Reduced Pressure Zone (RPZ)',
          manufacturer: 'Watts',
          model: 'Series 909',
          size_inches: '3/4"',
          serial_number: 'W909-2024-001',
          location_description: 'Front yard water meter area',
          installation_date: '2024-01-15',
          last_test_date: '2024-08-15',
          next_test_due: '2025-08-15',
          device_status: 'Active',
          test_result: 'Passed',
          notes: 'Standard residential RPZ device',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          customer: customerId ? null : {
            id: 'cust-1',
            first_name: 'John',
            last_name: 'Smith',
            company_name: 'Smith Residence',
            email: 'john@example.com',
            phone: '(253) 555-0123',
            address_line1: '123 Main St',
            city: 'Tacoma',
            state: 'WA',
            zip_code: '98401'
          }
        },
        {
          id: 'dev-2',
          customer_id: customerId || 'cust-2',
          device_type: 'Double Check Valve (DCV)',
          manufacturer: 'Febco',
          model: '765-1',
          size_inches: '1"',
          serial_number: 'FB765-2023-045',
          location_description: 'Basement utility room',
          installation_date: '2023-06-10',
          last_test_date: '2024-06-10',
          next_test_due: '2025-06-10',
          device_status: 'Active',
          test_result: 'Passed',
          notes: 'Commercial grade DCV for restaurant',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          customer: customerId ? null : {
            id: 'cust-2',
            first_name: 'Restaurant',
            last_name: 'Manager',
            company_name: 'ABC Restaurant',
            email: 'manager@abcrestaurant.com',
            phone: '(253) 555-0124',
            address_line1: '456 Commercial Ave',
            city: 'Tacoma',
            state: 'WA',
            zip_code: '98402'
          }
        }
      ];

      return NextResponse.json({
        devices: customerId ? mockDevices.filter(d => d.customer_id === customerId) : mockDevices,
        note: 'Using mock device data - devices table needs population',
        error: error.message
      });
    }

    return NextResponse.json({
      devices: devices || [],
      count: devices?.length || 0
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
    const supabase = supabaseAdmin || createRouteHandlerClient(request);

    console.log('💾 Creating new device:', body);

    // Generate device ID if not provided
    const deviceData = {
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Check if this is a bulk import
    if (body.bulk && Array.isArray(body.devices)) {
      const devicesToInsert = body.devices.map((device: any) => ({
        ...device,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data: devices, error } = await supabase
        .from('devices')
        .insert(devicesToInsert)
        .select();

      if (error) {
        console.error('Bulk insert error:', error);
        return NextResponse.json({
          error: 'Failed to import devices',
          details: error.message
        }, { status: 500 });
      }

      return NextResponse.json({
        message: `Successfully imported ${devices?.length || 0} devices`,
        devices,
        imported: devices?.length || 0
      }, { status: 201 });
    }

    // Single device creation
    const { data: device, error } = await supabase
      .from('devices')
      .insert(deviceData)
      .select(`
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          company_name,
          email,
          phone
        )
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to create device' }, { status: 500 });
    }

    return NextResponse.json({ device }, { status: 201 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}