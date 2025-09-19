import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { triggerWebhook, WEBHOOK_EVENTS } from '@/lib/webhooks'

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

// GET /api/v1/appointments - List appointments
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApiKey(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const status = searchParams.get('status')
    const customer_id = searchParams.get('customer_id')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    let query = supabase
      .from('appointments')
      .select(`
        id,
        customer_id,
        scheduled_date,
        time_slot,
        service_type,
        status,
        technician_id,
        notes,
        created_at,
        updated_at,
        customers (
          id,
          first_name,
          last_name,
          email,
          phone,
          address,
          city,
          state
        )
      `, { count: 'exact' })
      .eq('company_id', auth.company.id)
      .order('scheduled_date', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    
    if (customer_id) {
      query = query.eq('customer_id', customer_id)
    }

    if (date_from) {
      query = query.gte('scheduled_date', date_from)
    }

    if (date_to) {
      query = query.lte('scheduled_date', date_to)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: appointments, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
    }

    // Log API usage
    await supabase
      .from('api_usage_logs')
      .insert({
        api_key_id: auth.apiKey.id,
        company_id: auth.company.id,
        endpoint: '/appointments',
        method: 'GET',
        status_code: 200,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json({
      data: appointments || [],
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

// POST /api/v1/appointments - Create appointment
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApiKey(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const {
      customer_id,
      scheduled_date,
      time_slot,
      service_type,
      technician_id,
      notes
    } = body

    // Validate required fields
    if (!customer_id || !scheduled_date || !service_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: customer_id, scheduled_date, service_type' 
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

    // Create appointment
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        company_id: auth.company.id,
        customer_id,
        scheduled_date,
        time_slot: time_slot || 'TBD',
        service_type,
        technician_id: technician_id || null,
        notes: notes || null,
        status: 'scheduled'
      })
      .select(`
        id,
        customer_id,
        scheduled_date,
        time_slot,
        service_type,
        status,
        technician_id,
        notes,
        created_at,
        customers (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
    }

    // Trigger webhook for appointment creation
    await triggerWebhook(auth.company.id, WEBHOOK_EVENTS.APPOINTMENT_SCHEDULED, {
      appointment: appointment
    })

    // Log API usage
    await supabase
      .from('api_usage_logs')
      .insert({
        api_key_id: auth.apiKey.id,
        company_id: auth.company.id,
        endpoint: '/appointments',
        method: 'POST',
        status_code: 201,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json({
      data: appointment,
      message: 'Appointment created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}