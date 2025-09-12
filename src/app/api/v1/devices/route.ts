import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// API key authentication
async function authenticateApiKey(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey) {
    return { error: 'API key required', status: 401 }
  }

  const { data: apiKeyRecord, error } = await supabase
    .from('api_keys')
    .select(`
      id,
      company_id,
      name,
      is_active,
      rate_limit_per_hour,
      companies (
        id,
        name,
        subscription_status
      )
    `)
    .eq('key_hash', apiKey)
    .eq('is_active', true)
    .single()

  if (error || !apiKeyRecord) {
    return { error: 'Invalid API key', status: 401 }
  }

  if (!['active', 'trialing'].includes(apiKeyRecord.companies.subscription_status)) {
    return { error: 'Subscription not active', status: 403 }
  }

  return { 
    company: apiKeyRecord.companies,
    apiKey: apiKeyRecord,
    success: true 
  }
}

// GET /api/v1/devices - List devices
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApiKey(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const customer_id = searchParams.get('customer_id')
    const device_type = searchParams.get('device_type')
    const status = searchParams.get('status')

    let query = supabase
      .from('devices')
      .select(`
        id,
        customer_id,
        location,
        device_type,
        manufacturer,
        model,
        serial_number,
        installation_date,
        last_test_date,
        next_test_due,
        status,
        compliance_status,
        created_at,
        updated_at,
        customers (
          id,
          first_name,
          last_name,
          email,
          address,
          city,
          state
        )
      `, { count: 'exact' })
      .eq('company_id', auth.company.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (customer_id) {
      query = query.eq('customer_id', customer_id)
    }
    
    if (device_type) {
      query = query.eq('device_type', device_type)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: devices, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 })
    }

    // Log API usage
    await supabase
      .from('api_usage_logs')
      .insert({
        api_key_id: auth.apiKey.id,
        company_id: auth.company.id,
        endpoint: '/devices',
        method: 'GET',
        status_code: 200,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json({
      data: devices || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/v1/devices - Create device
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApiKey(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const {
      customer_id,
      location,
      device_type,
      manufacturer,
      model,
      serial_number,
      installation_date
    } = body

    // Validate required fields
    if (!customer_id || !location || !device_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: customer_id, location, device_type' 
      }, { status: 400 })
    }

    // Verify customer belongs to this company
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customer_id)
      .eq('company_id', auth.company.id)
      .single()

    if (!customer) {
      return NextResponse.json({ 
        error: 'Customer not found or does not belong to your company' 
      }, { status: 404 })
    }

    // Create device
    const { data: device, error } = await supabase
      .from('devices')
      .insert({
        company_id: auth.company.id,
        customer_id,
        location,
        device_type,
        manufacturer: manufacturer || null,
        model: model || null,
        serial_number: serial_number || null,
        installation_date: installation_date || null,
        status: 'active',
        compliance_status: 'pending'
      })
      .select(`
        id,
        customer_id,
        location,
        device_type,
        manufacturer,
        model,
        serial_number,
        installation_date,
        status,
        compliance_status,
        created_at,
        customers (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create device' }, { status: 500 })
    }

    // Log API usage
    await supabase
      .from('api_usage_logs')
      .insert({
        api_key_id: auth.apiKey.id,
        company_id: auth.company.id,
        endpoint: '/devices',
        method: 'POST',
        status_code: 201,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json({
      data: device,
      message: 'Device created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}