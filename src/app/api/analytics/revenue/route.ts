import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs';
import { createRouteHandlerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request)
    
    // Verify authentication and permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('team_users')
      .select('role')
      .eq('email', user.email)
      .single()

    if (!profile || !['admin', 'manager'].includes((profile as any).role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // month, quarter, year
    const breakdown = searchParams.get('breakdown') || 'time' // time, service, customer

    // Base revenue query
    const baseQuery = supabase
      .from('payments')
      .select(`
        *,
        customer:customers(first_name, last_name, company_name),
        invoice:invoices(
          invoice_number,
          appointment:appointments(appointment_type),
          test_report:test_reports(test_type)
        )
      `)
      .eq('status', 'completed')

    let timeRange = ''
    const now = new Date()
    
    switch (period) {
      case 'month':
        timeRange = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString()
        break
      case 'quarter':
        timeRange = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString()
        break
      case 'year':
        timeRange = new Date(now.getFullYear() - 2, 0, 1).toISOString()
        break
    }

    const { data: payments, error } = await baseQuery.gte('payment_date', timeRange)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 })
    }

    // Process data based on breakdown type
    let processedData: any = {}

    switch (breakdown) {
      case 'time':
        processedData = processTimeBreakdown(payments || [], period)
        break
      case 'service':
        processedData = processServiceBreakdown(payments || [])
        break
      case 'customer':
        processedData = processCustomerBreakdown(payments || [])
        break
      default:
        processedData = processTimeBreakdown(payments || [], period)
    }

    // Calculate summary statistics
    const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
    const totalTransactions = payments?.length || 0
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

    const summary = {
      totalRevenue,
      totalTransactions,
      averageTransaction: Math.round(averageTransaction * 100) / 100,
      period,
      breakdown,
      dataRange: {
        start: timeRange,
        end: now.toISOString()
      }
    }

    return NextResponse.json({
      summary,
      data: processedData,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Revenue analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function processTimeBreakdown(payments: any[], period: string) {
  const breakdown = new Map<string, { revenue: number; count: number }>()

  payments.forEach(payment => {
    const date = new Date(payment.payment_date)
    let key = ''
    
    switch (period) {
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      case 'quarter':
        key = `${date.getFullYear()}-Q${Math.ceil((date.getMonth() + 1) / 3)}`
        break
      case 'year':
        key = date.getFullYear().toString()
        break
    }

    const current = breakdown.get(key) || { revenue: 0, count: 0 }
    breakdown.set(key, {
      revenue: current.revenue + Number(payment.amount),
      count: current.count + 1
    })
  })

  return Array.from(breakdown.entries()).map(([period, data]) => ({
    period,
    revenue: data.revenue,
    transactions: data.count,
    averageTransaction: data.count > 0 ? data.revenue / data.count : 0
  })).sort((a, b) => a.period.localeCompare(b.period))
}

function processServiceBreakdown(payments: any[]) {
  const serviceBreakdown = new Map<string, { revenue: number; count: number }>()

  payments.forEach(payment => {
    const serviceType = payment.invoice?.appointment?.appointment_type || 
                      payment.invoice?.test_report?.test_type || 
                      'Other'
    
    const current = serviceBreakdown.get(serviceType) || { revenue: 0, count: 0 }
    serviceBreakdown.set(serviceType, {
      revenue: current.revenue + Number(payment.amount),
      count: current.count + 1
    })
  })

  return Array.from(serviceBreakdown.entries()).map(([service, data]) => ({
    service,
    revenue: data.revenue,
    transactions: data.count,
    percentage: 0 // Will be calculated on frontend
  })).sort((a, b) => b.revenue - a.revenue)
}

function processCustomerBreakdown(payments: any[]) {
  const customerBreakdown = new Map<string, { revenue: number; count: number; customer: any }>()

  payments.forEach(payment => {
    const customerId = payment.customer_id
    const customerName = payment.customer 
      ? `${payment.customer.first_name} ${payment.customer.last_name}`
      : 'Unknown Customer'
    
    const current = customerBreakdown.get(customerId) || { 
      revenue: 0, 
      count: 0, 
      customer: payment.customer 
    }
    
    customerBreakdown.set(customerId, {
      revenue: current.revenue + Number(payment.amount),
      count: current.count + 1,
      customer: current.customer
    })
  })

  return Array.from(customerBreakdown.entries()).map(([customerId, data]) => ({
    customerId,
    customerName: data.customer 
      ? `${data.customer.first_name} ${data.customer.last_name}`
      : 'Unknown Customer',
    companyName: data.customer?.company_name,
    revenue: data.revenue,
    transactions: data.count,
    averageTransaction: data.count > 0 ? data.revenue / data.count : 0
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 25)
}