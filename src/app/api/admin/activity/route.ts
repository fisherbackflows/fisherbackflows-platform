import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get recent activities from various tables
    const activities = []

    try {
      // Recent test completions
      const { data: testReports } = await supabase
        .from('test_reports')
        .select(`
          id,
          created_at,
          test_result,
          customers (
            name,
            address
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      testReports?.forEach(report => {
        activities.push({
          id: `test_${report.id}`,
          type: 'test_completed',
          icon: 'CheckCircle',
          text: `Test completed for ${report.customers?.name || 'Customer'} - ${report.customers?.address || 'Address'}`,
          time: getRelativeTime(report.created_at),
          color: report.test_result === 'Passed' ? 'text-green-400' : 
                 report.test_result === 'Failed' ? 'text-red-400' : 'text-yellow-400',
          timestamp: report.created_at
        })
      })
    } catch (error) {
      console.warn('Could not fetch test reports:', error)
    }

    try {
      // Recent invoices sent
      const { data: invoices } = await supabase
        .from('invoices')
        .select(`
          id,
          created_at,
          amount,
          customers (
            name
          )
        `)
        .eq('status', 'sent')
        .order('created_at', { ascending: false })
        .limit(5)

      invoices?.forEach(invoice => {
        activities.push({
          id: `invoice_${invoice.id}`,
          type: 'invoice_sent',
          icon: 'Mail',
          text: `Invoice sent to ${invoice.customers?.name || 'Customer'} - $${invoice.amount?.toFixed(2) || '0.00'}`,
          time: getRelativeTime(invoice.created_at),
          color: 'text-blue-400',
          timestamp: invoice.created_at
        })
      })
    } catch (error) {
      console.warn('Could not fetch invoices:', error)
    }

    try {
      // Recent payments received
      const { data: payments } = await supabase
        .from('payments')
        .select(`
          id,
          created_at,
          amount,
          customers (
            name
          )
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5)

      payments?.forEach(payment => {
        activities.push({
          id: `payment_${payment.id}`,
          type: 'payment_received',
          icon: 'DollarSign',
          text: `Payment received from ${payment.customers?.name || 'Customer'} - $${payment.amount?.toFixed(2) || '0.00'}`,
          time: getRelativeTime(payment.created_at),
          color: 'text-green-400',
          timestamp: payment.created_at
        })
      })
    } catch (error) {
      console.warn('Could not fetch payments:', error)
    }

    try {
      // Recent appointment scheduling
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          id,
          created_at,
          status,
          customers (
            name
          )
        `)
        .eq('status', 'scheduled')
        .order('created_at', { ascending: false })
        .limit(3)

      appointments?.forEach(appointment => {
        activities.push({
          id: `appointment_${appointment.id}`,
          type: 'appointment_scheduled',
          icon: 'Calendar',
          text: `Appointment scheduled for ${appointment.customers?.name || 'Customer'}`,
          time: getRelativeTime(appointment.created_at),
          color: 'text-blue-400',
          timestamp: appointment.created_at
        })
      })
    } catch (error) {
      console.warn('Could not fetch appointments:', error)
    }

    // Sort activities by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    // If no real activities, provide sample data
    if (sortedActivities.length === 0) {
      return NextResponse.json({
        success: true,
        activities: [
          {
            id: 'sample_1',
            type: 'system_ready',
            icon: 'CheckCircle',
            text: 'System initialized and ready for automation',
            time: 'Just now',
            color: 'text-green-400'
          },
          {
            id: 'sample_2',
            type: 'dashboard_loaded',
            icon: 'Activity',
            text: 'Dashboard loaded - awaiting first automated activities',
            time: '1 minute ago',
            color: 'text-blue-400'
          }
        ]
      })
    }

    return NextResponse.json({
      success: true,
      activities: sortedActivities
    })

  } catch (error) {
    console.error('Error in activity API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate relative time
function getRelativeTime(timestamp: string): string {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now.getTime() - then.getTime()
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  
  return then.toLocaleDateString()
}