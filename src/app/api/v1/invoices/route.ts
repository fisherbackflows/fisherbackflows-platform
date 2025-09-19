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

// GET /api/v1/invoices - List invoices
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
    const status = searchParams.get('status')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    let query = supabase
      .from('invoices')
      .select(`
        id,
        customer_id,
        invoice_number,
        amount,
        status,
        due_date,
        description,
        invoice_date,
        paid_date,
        created_at,
        updated_at,
        customers (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `, { count: 'exact' })
      .eq('company_id', auth.company.id)
      .order('invoice_date', { ascending: false })

    // Apply filters
    if (customer_id) {
      query = query.eq('customer_id', customer_id)
    }
    
    if (status) {
      query = query.eq('status', status)
    }

    if (date_from) {
      query = query.gte('invoice_date', date_from)
    }

    if (date_to) {
      query = query.lte('invoice_date', date_to)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: invoices, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    // Log API usage
    await supabase
      .from('api_usage_logs')
      .insert({
        api_key_id: auth.apiKey.id,
        company_id: auth.company.id,
        endpoint: '/invoices',
        method: 'GET',
        status_code: 200,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json({
      data: invoices || [],
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

// POST /api/v1/invoices - Create invoice
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApiKey(request)
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const {
      customer_id,
      amount,
      description,
      due_date,
      line_items
    } = body

    // Validate required fields
    if (!customer_id || !amount || !description) {
      return NextResponse.json({ 
        error: 'Missing required fields: customer_id, amount, description' 
      }, { status: 400 })
    }

    // Verify customer belongs to this company
    const { data: customer } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email')
      .eq('id', customer_id)
      .eq('company_id', auth.company.id)
      .single()

    if (!customer) {
      return NextResponse.json({ 
        error: 'Customer not found or does not belong to your company' 
      }, { status: 404 })
    }

    // Generate invoice number
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('company_id', auth.company.id)
      .order('invoice_number', { ascending: false })
      .limit(1)
      .single()

    let invoiceNumber = 'INV-0001'
    if (lastInvoice?.invoice_number) {
      const lastNum = parseInt(lastInvoice.invoice_number.split('-')[1]) || 0
      invoiceNumber = `INV-${(lastNum + 1).toString().padStart(4, '0')}`
    }

    // Calculate due date (30 days from now if not provided)
    const invoiceDueDate = due_date || new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]

    // Create invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        company_id: auth.company.id,
        customer_id,
        invoice_number: invoiceNumber,
        amount: parseFloat(amount),
        description,
        due_date: invoiceDueDate,
        invoice_date: new Date().toISOString().split('T')[0],
        status: 'pending'
      })
      .select(`
        id,
        customer_id,
        invoice_number,
        amount,
        status,
        due_date,
        description,
        invoice_date,
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
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    // Create line items if provided
    if (line_items && Array.isArray(line_items)) {
      const lineItemsToInsert = line_items.map(item => ({
        company_id: auth.company.id,
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity || 1,
        unit_price: parseFloat(item.unit_price || 0),
        total: (item.quantity || 1) * parseFloat(item.unit_price || 0)
      }))

      await supabase
        .from('invoice_line_items')
        .insert(lineItemsToInsert)
    }

    // Trigger webhook for invoice creation
    await triggerWebhook(auth.company.id, WEBHOOK_EVENTS.INVOICE_CREATED, {
      invoice: invoice
    })

    // Log API usage
    await supabase
      .from('api_usage_logs')
      .insert({
        api_key_id: auth.apiKey.id,
        company_id: auth.company.id,
        endpoint: '/invoices',
        method: 'POST',
        status_code: 201,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    return NextResponse.json({
      data: invoice,
      message: 'Invoice created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}