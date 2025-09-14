import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';
import { auth } from '@/lib/auth';

// Device validation schema
const DEVICE_TYPES = [
  'Reduced Pressure Zone (RPZ)',
  'Double Check Valve (DCV)',
  'Pressure Vacuum Breaker (PVB)',
  'Atmospheric Vacuum Breaker (AVB)',
  'Air Gap',
  'Other'
] as const;

const MANUFACTURERS = [
  'Watts', 'Febco', 'Wilkins', 'Ames', 'Apollo', 'Conbraco', 'Other'
] as const;

const DEVICE_SIZES = [
  '1/2"', '3/4"', '1"', '1 1/4"', '1 1/2"', '2"', '2 1/2"', '3"', '4"', '6"', '8"', '10"', '12"'
] as const;

interface DeviceRegistrationData {
  device_type: string;
  manufacturer: string;
  model: string;
  size_inches: string;
  serial_number?: string;
  location_description: string;
  installation_date?: string;
  notes?: string;
}

function validateDeviceData(data: any): { isValid: boolean; errors: string[]; cleanData?: DeviceRegistrationData } {
  const errors: string[] = [];

  // Required fields
  if (!data.device_type?.trim()) {
    errors.push('Device type is required');
  } else if (!DEVICE_TYPES.includes(data.device_type)) {
    errors.push('Invalid device type');
  }

  if (!data.manufacturer?.trim()) {
    errors.push('Manufacturer is required');
  }

  if (!data.model?.trim()) {
    errors.push('Model is required');
  }

  if (!data.size_inches?.trim()) {
    errors.push('Device size is required');
  } else if (!DEVICE_SIZES.includes(data.size_inches)) {
    errors.push('Invalid device size');
  }

  if (!data.location_description?.trim()) {
    errors.push('Location description is required');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Clean and structure data
  const cleanData: DeviceRegistrationData = {
    device_type: data.device_type.trim(),
    manufacturer: data.manufacturer.trim(),
    model: data.model.trim(),
    size_inches: data.size_inches.trim(),
    location_description: data.location_description.trim(),
    serial_number: data.serial_number?.trim() || null,
    installation_date: data.installation_date?.trim() || null,
    notes: data.notes?.trim() || null
  };

  return { isValid: true, errors: [], cleanData };
}

// GET - Fetch customer's devices
export async function GET(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized - Customer access required' }, { status: 401 });
    }

    const supabase = supabaseAdmin || createRouteHandlerClient(request);

    console.log(`🔍 [Customer Portal] Fetching devices for customer ${user.customerId}`);

    // Get customer's devices
    const { data: devices, error } = await supabase
      .from('devices')
      .select(`
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('customer_id', user.customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        error: 'Failed to fetch devices',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      devices: devices || [],
      count: devices?.length || 0
    });

  } catch (error) {
    console.error('Customer devices API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Register new device
export async function POST(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized - Customer access required' }, { status: 401 });
    }

    const body = await request.json();
    const validation = validateDeviceData(body);

    if (!validation.isValid) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.errors
      }, { status: 400 });
    }

    const supabase = supabaseAdmin || createRouteHandlerClient(request);

    console.log(`💾 [Customer Portal] Registering device for customer ${user.customerId}:`, validation.cleanData);

    // Check for duplicate serial number if provided
    if (validation.cleanData!.serial_number) {
      const { data: existingDevice } = await supabase
        .from('devices')
        .select('id, customer_id')
        .eq('serial_number', validation.cleanData!.serial_number)
        .single();

      if (existingDevice) {
        return NextResponse.json({
          error: 'Device with this serial number already exists',
          existingDevice: existingDevice.customer_id === user.customerId ? 'yours' : 'another customer'
        }, { status: 400 });
      }
    }

    // Create device record
    const deviceData = {
      customer_id: user.customerId,
      ...validation.cleanData,
      device_status: 'Active',
      next_test_due: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: device, error } = await supabase
      .from('devices')
      .insert(deviceData)
      .select(`
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        error: 'Failed to register device',
        details: error.message
      }, { status: 500 });
    }

    console.log(`✅ [Customer Portal] Device registered successfully: ${device.id}`);

    return NextResponse.json({
      success: true,
      message: 'Device registered successfully',
      device
    }, { status: 201 });

  } catch (error) {
    console.error('Device registration API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT - Update device
export async function PUT(request: NextRequest) {
  try {
    const user = await auth.getApiUser(request);
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized - Customer access required' }, { status: 401 });
    }

    const body = await request.json();
    const { deviceId, ...updateData } = body;

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    const validation = validateDeviceData(updateData);
    if (!validation.isValid) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.errors
      }, { status: 400 });
    }

    const supabase = supabaseAdmin || createRouteHandlerClient(request);

    // Verify device ownership
    const { data: existingDevice } = await supabase
      .from('devices')
      .select('id, customer_id')
      .eq('id', deviceId)
      .eq('customer_id', user.customerId)
      .single();

    if (!existingDevice) {
      return NextResponse.json({ error: 'Device not found or access denied' }, { status: 404 });
    }

    // Update device
    const { data: device, error } = await supabase
      .from('devices')
      .update({
        ...validation.cleanData,
        updated_at: new Date().toISOString()
      })
      .eq('id', deviceId)
      .eq('customer_id', user.customerId)
      .select(`
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        error: 'Failed to update device',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Device updated successfully',
      device
    });

  } catch (error) {
    console.error('Device update API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}