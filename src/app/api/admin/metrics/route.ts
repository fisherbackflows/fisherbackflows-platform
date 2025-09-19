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

    // Verify user is an admin - restrict to admin only
    const { data: profile } = await supabase
      .from('team_users')
      .select('role, company_id')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const userCompanyId = profile.company_id;
    if (!userCompanyId) {
      return NextResponse.json(
        { success: false, error: 'User company not found' },
        { status: 400 }
      )
    }

    // Get date ranges
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisYear = new Date(now.getFullYear(), 0, 1)

    // Get customer metrics - SECURITY FIX: Filter by company
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
      .eq('company_id', userCompanyId)

    if (customerError) {
      // SECURITY FIX: Remove console.error in production
      return NextResponse.json(
        { success: false, error: 'Failed to fetch customer data' },
        { status: 500 }
      )
    }

    // Calculate customer metrics
    const totalCustomers = customers?.length || 0
    const activeCustomers = customers?.filter((c: any) => c.status === 'active').length || 0
    
    // Customers needing service (next test due within 30 days or overdue)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    const customersNeedingService = customers?.filter((customer: any) => {
      const customerWithDevices = customer as { devices?: Array<{ next_test_due?: string }> };
      return customerWithDevices.devices?.some(device => {
        if (!device.next_test_due) return false
        const dueDate = new Date(device.next_test_due)
        return dueDate <= thirtyDaysFromNow
      })
    }).length || 0

    // Get appointment metrics - SECURITY FIX: Filter by company
    const { data: appointments, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('company_id', userCompanyId)
      .gte('created_at', thisMonth.toISOString())

    if (appointmentError) {
      // SECURITY FIX: Remove console.error in production
      return NextResponse.json(
        { success: false, error: 'Failed to fetch appointment data' },
        { status: 500 }
      )
    }

    const scheduledAppointments = appointments?.filter((a: any) => a.status === 'scheduled').length || 0
    const completedAppointments = appointments?.filter((a: any) => a.status === 'completed').length || 0
    const pendingAppointments = appointments?.filter((a: any) => a.status === 'confirmed' || a.status === 'pending').length || 0

    // Get financial metrics - SECURITY FIX: Filter by company
    const { data: invoices, error: invoiceError } = await supabase
      .from('invoices')
      .select('amount, status, created_at')
      .eq('company_id', userCompanyId)
      .gte('created_at', thisMonth.toISOString())

    if (invoiceError) {
      // SECURITY FIX: Remove console.error in production
      return NextResponse.json(
        { success: false, error: 'Failed to fetch financial data' },
        { status: 500 }
      )
    }

    const monthlyRevenue = invoices?.reduce((total: number, invoice: any) => {
      return invoice.status === 'paid' ? total + (invoice.amount || 0) : total
    }, 0) || 0

    const pendingInvoices = invoices?.filter((i: any) => i.status === 'pending' || i.status === 'sent').length || 0
    const overdueInvoices = invoices?.filter((i: any) => {
      if (i.status !== 'pending' && i.status !== 'sent') return false
      const invoiceDate = new Date(i.created_at)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return invoiceDate <= thirtyDaysAgo
    }).length || 0

    // Get test report metrics for this year - SECURITY FIX: Filter by company
    const { data: testReports, error: testError } = await supabase
      .from('test_reports')
      .select('*')
      .eq('company_id', userCompanyId)
      .gte('created_at', thisYear.toISOString())

    if (testError) {
      // SECURITY FIX: Remove console.error in production
      return NextResponse.json(
        { success: false, error: 'Failed to fetch test report data' },
        { status: 500 }
      )
    }

    const totalTests = testReports?.length || 0
    const passedTests = testReports?.filter((t: any) => t.test_result === 'Passed').length || 0
    const failedTests = testReports?.filter((t: any) => t.test_result === 'Failed').length || 0

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
    // SECURITY FIX: Remove console.error in production
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}