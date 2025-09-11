import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// API key authentication middleware
async function authenticateApiKey(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey) {
    return { error: 'API key required', status: 401 }
  }

  // Verify API key and get associated company
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

// GET /api/v1/customers - List customers
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApiKey(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    let query = supabase
      .from('customers')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        address,
        city,
        state,
        zip_code,
        is_active,
        email_verified,
        next_test_date,
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('company_id', auth.company.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    
    if (status) {
      query = query.eq('is_active', status === 'active')
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: customers, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
    }

    return NextResponse.json({
      data: customers || [],
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

// POST /api/v1/customers - Create customer
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApiKey(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const {
      email,
      first_name,
      last_name,
      phone,
      address,
      city,
      state,
      zip_code,
      send_welcome_email = true
    } = body

    // Validate required fields
    if (!email || !first_name || !last_name) {
      return NextResponse.json({ 
        error: 'Missing required fields: email, first_name, last_name' 
      }, { status: 400 })
    }

    // Check if customer already exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('company_id', auth.company.id)
      .eq('email', email.toLowerCase())
      .single()

    if (existingCustomer) {
      return NextResponse.json({ 
        error: 'Customer with this email already exists' 
      }, { status: 409 })
    }

    // Create customer
    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        company_id: auth.company.id,
        email: email.toLowerCase(),
        first_name,
        last_name,
        phone,
        address,
        city,
        state,
        zip_code,
        is_active: true,
        email_verified: false
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
    }

    // TODO: Send welcome email if requested
    if (send_welcome_email) {
      // Implement email sending logic
    }

    // Log API usage
    await supabase
      .from('api_usage_logs')
      .insert({
        api_key_id: auth.apiKey.id,
        company_id: auth.company.id,
        endpoint: '/customers',
        method: 'POST',
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json({
      data: customer,
      message: 'Customer created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}