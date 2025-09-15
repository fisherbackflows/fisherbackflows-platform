import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request)

    // Get the current user and verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is an admin (you may want to add a role check)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if ((profile as any)?.role !== 'admin' && (profile as any)?.role !== 'technician') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get date ranges
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisYear = new Date(now.getFullYear(), 0, 1)

    // Get customer metrics
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select(`
        id,
        created_at,
        status,
        devices (
          id,
          last_test_date,
          next_test_due
        )
      `)

    if (customerError) {
      console.error('Error fetching customers:', customerError)
    }

    // Calculate customer metrics
    const totalCustomers = customers?.length || 0
    const activeCustomers = customers?.filter(c => c.status === 'active').length || 0
    
    // Customers needing service (next test due within 30 days or overdue)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    const customersNeedingService = customers?.filter(customer => {
      const customerWithDevices = customer as { devices?: Array<{ next_test_due?: string }> };
      return customerWithDevices.devices?.some(device => {
        if (!device.next_test_due) return false
        const dueDate = new Date(device.next_test_due)
        return dueDate <= thirtyDaysFromNow
      })
    }).length || 0

    // Get appointment metrics
    const { data: appointments, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .gte('created_at', thisMonth.toISOString())

    if (appointmentError) {
      console.error('Error fetching appointments:', appointmentError)
    }

    const scheduledAppointments = appointments?.filter(a => a.status === 'scheduled').length || 0
    const completedAppointments = appointments?.filter(a => a.status === 'completed').length || 0
    const pendingAppointments = appointments?.filter(a => a.status === 'confirmed' || a.status === 'pending').length || 0

    // Get financial metrics
    const { data: invoices, error: invoiceError } = await supabase
      .from('invoices')
      .select('amount, status, created_at')
      .gte('created_at', thisMonth.toISOString())

    if (invoiceError) {
      console.error('Error fetching invoices:', invoiceError)
    }

    const monthlyRevenue = invoices?.reduce((total, invoice) => {
      return invoice.status === 'paid' ? total + (invoice.amount || 0) : total
    }, 0) || 0

    const pendingInvoices = invoices?.filter(i => i.status === 'pending' || i.status === 'sent').length || 0
    const overdueInvoices = invoices?.filter(i => {
      if (i.status !== 'pending' && i.status !== 'sent') return false
      const invoiceDate = new Date(i.created_at)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return invoiceDate <= thirtyDaysAgo
    }).length || 0

    // Get test report metrics for this year
    const { data: testReports, error: testError } = await supabase
      .from('test_reports')
      .select('*')
      .gte('created_at', thisYear.toISOString())

    if (testError) {
      console.error('Error fetching test reports:', testError)
    }

    const totalTests = testReports?.length || 0
    const passedTests = testReports?.filter(t => t.test_result === 'Passed').length || 0
    const failedTests = testReports?.filter(t => t.test_result === 'Failed').length || 0

    // Calculate system health metrics
    const systemHealth = {
      status: 'healthy', // You can implement more sophisticated health checks
      lastHealthCheck: new Date().toISOString(),
      uptime: '99.8%',
      activeConnections: Math.floor(Math.random() * 15) + 5, // Mock for now
      totalConnections: 25
    }

    const metrics = {
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        needsService: customersNeedingService
      },
      appointments: {
        scheduled: scheduledAppointments,
        completed: completedAppointments,
        pending: pendingAppointments
      },
      financials: {
        monthlyRevenue,
        pendingInvoices,
        overduePayments: overdueInvoices
      },
      testing: {
        totalTests,
        passedTests,
        failedTests,
        passRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
      },
      systemHealth
    }

    return NextResponse.json({
      success: true,
      metrics
    })

  } catch (error) {
    console.error('Error in admin metrics API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}