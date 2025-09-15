import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyCustomerToken } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = params
    
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    
    // Verify customer token and get customer data
    const customerData = await verifyCustomerToken(token)
    if (!customerData) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }
    
    // Verify the company slug matches the customer's company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, slug, name')
      .eq('slug', slug)
      .single()
    
    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }
    
    if (customerData.company_id !== company.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name, email, next_test_date, status')
      .eq('id', customerData.customer_id)
      .eq('company_id', company.id)
      .single()
    
    if (customerError) {
      console.error('Error fetching customer:', customerError)
      return NextResponse.json({ error: 'Failed to fetch customer data' }, { status: 500 })
    }
    
    // Get upcoming appointments
    const { data: upcomingAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_date,
        time_slot,
        service_type,
        status
      `)
      .eq('customer_id', customer.id)
      .eq('company_id', company.id)
      .gte('scheduled_date', new Date().toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true })
      .limit(5)
    
    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError)
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
    }
    
    // Get recent test reports
    const { data: recentReports, error: reportsError } = await supabase
      .from('test_reports')
      .select(`
        id,
        test_date,
        result,
        device_location
      `)
      .eq('customer_id', customer.id)
      .eq('company_id', company.id)
      .order('test_date', { ascending: false })
      .limit(5)
    
    if (reportsError) {
      console.error('Error fetching reports:', reportsError)
      return NextResponse.json({ error: 'Failed to fetch test reports' }, { status: 500 })
    }
    
    // Get pending invoices
    const { data: pendingInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        id,
        amount,
        due_date,
        description
      `)
      .eq('customer_id', customer.id)
      .eq('company_id', company.id)
      .eq('status', 'pending')
      .order('due_date', { ascending: true })
    
    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }
    
    // Return dashboard data
    return NextResponse.json({
      customer,
      upcomingAppointments: upcomingAppointments || [],
      recentReports: recentReports || [],
      pendingInvoices: pendingInvoices || []
    })
    
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}