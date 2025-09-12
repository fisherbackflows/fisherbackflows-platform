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

// GET /api/v1/reports - List test reports
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
    const device_id = searchParams.get('device_id')
    const result = searchParams.get('result')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    let query = supabase
      .from('test_reports')
      .select(`
        id,
        customer_id,
        device_id,
        test_date,
        result,
        pressure_1,
        pressure_2,
        pressure_differential,
        test_duration,
        technician_id,
        certificate_number,
        notes,
        created_at,
        customers (
          id,
          first_name,
          last_name,
          email
        ),
        devices (
          id,
          location,
          device_type,
          manufacturer,
          model
        )
      `, { count: 'exact' })
      .eq('company_id', auth.company.id)
      .order('test_date', { ascending: false })

    // Apply filters
    if (customer_id) {
      query = query.eq('customer_id', customer_id)
    }
    
    if (device_id) {
      query = query.eq('device_id', device_id)
    }

    if (result) {
      query = query.eq('result', result)
    }

    if (date_from) {
      query = query.gte('test_date', date_from)
    }

    if (date_to) {
      query = query.lte('test_date', date_to)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: reports, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    // Log API usage
    await supabase
      .from('api_usage_logs')
      .insert({
        api_key_id: auth.apiKey.id,
        company_id: auth.company.id,
        endpoint: '/reports',
        method: 'GET',
        status_code: 200,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json({
      data: reports || [],
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

// POST /api/v1/reports - Create test report
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApiKey(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const {
      customer_id,
      device_id,
      test_date,
      result,
      pressure_1,
      pressure_2,
      pressure_differential,
      test_duration,
      technician_id,
      certificate_number,
      notes
    } = body

    // Validate required fields
    if (!customer_id || !device_id || !test_date || !result) {
      return NextResponse.json({ 
        error: 'Missing required fields: customer_id, device_id, test_date, result' 
      }, { status: 400 })
    }

    // Verify customer and device belong to this company
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

    const { data: device } = await supabase
      .from('devices')
      .select('id, location')
      .eq('id', device_id)
      .eq('company_id', auth.company.id)
      .eq('customer_id', customer_id)
      .single()

    if (!device) {
      return NextResponse.json({ 
        error: 'Device not found or does not belong to this customer' 
      }, { status: 404 })
    }

    // Create test report
    const { data: report, error } = await supabase
      .from('test_reports')
      .insert({
        company_id: auth.company.id,
        customer_id,
        device_id,
        test_date,
        result,
        pressure_1: pressure_1 || null,
        pressure_2: pressure_2 || null,
        pressure_differential: pressure_differential || null,
        test_duration: test_duration || null,
        technician_id: technician_id || null,
        certificate_number: certificate_number || null,
        notes: notes || null,
        device_location: device.location
      })
      .select(`
        id,
        customer_id,
        device_id,
        test_date,
        result,
        pressure_1,
        pressure_2,
        pressure_differential,
        test_duration,
        certificate_number,
        device_location,
        created_at,
        customers (
          id,
          first_name,
          last_name,
          email
        ),
        devices (
          id,
          location,
          device_type
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create test report' }, { status: 500 })
    }

    // Update device compliance status and next test date
    const nextTestDate = new Date(test_date)
    nextTestDate.setFullYear(nextTestDate.getFullYear() + 1) // Annual testing

    await supabase
      .from('devices')
      .update({
        last_test_date: test_date,
        next_test_due: nextTestDate.toISOString().split('T')[0],
        compliance_status: result === 'Passed' ? 'compliant' : 'non_compliant'
      })
      .eq('id', device_id)

    // Update customer next test date if this is their earliest due date
    await supabase
      .from('customers')
      .update({
        next_test_date: nextTestDate.toISOString().split('T')[0]
      })
      .eq('id', customer_id)
      .eq('company_id', auth.company.id)

    // Trigger webhook for test completion
    await triggerWebhook(auth.company.id, WEBHOOK_EVENTS.TEST_COMPLETED, {
      report: report
    })

    // Log API usage
    await supabase
      .from('api_usage_logs')
      .insert({
        api_key_id: auth.apiKey.id,
        company_id: auth.company.id,
        endpoint: '/reports',
        method: 'POST',
        status_code: 201,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json({
      data: report,
      message: 'Test report created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}