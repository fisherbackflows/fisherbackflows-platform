import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getTeamSession } from '@/lib/team-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await getTeamSession(request)
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get team member's company
    const { data: teamUser, error: teamError } = await supabase
      .from('team_users')
      .select('company_id')
      .eq('id', session.userId)
      .single()

    if (teamError || !teamUser) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    const companyId = teamUser.company_id

    // Get all stats in parallel for better performance
    const [
      customersResult,
      devicesResult,
      appointmentsResult,
      invoicesResult,
      testsResult,
      techniciansResult
    ] = await Promise.allSettled([
      // Customer count
      supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'active'),
      
      // Device count
      supabase
        .from('devices')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId),
      
      // Upcoming appointments
      supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('scheduled_date', new Date().toISOString())
        .eq('status', 'scheduled'),
      
      // Revenue this month
      supabase
        .from('invoices')
        .select('total_amount')
        .eq('company_id', companyId)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .eq('status', 'paid'),
      
      // Tests this month
      supabase
        .from('test_reports')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('test_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      
      // Active technicians
      supabase
        .from('team_users')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .in('role', ['technician', 'tester'])
        .eq('status', 'active')
    ])

    // Process results
    const customers = customersResult.status === 'fulfilled' 
      ? customersResult.value.count || 0 
      : 0

    const devices = devicesResult.status === 'fulfilled' 
      ? devicesResult.value.count || 0 
      : 0

    const appointments = appointmentsResult.status === 'fulfilled' 
      ? appointmentsResult.value.count || 0 
      : 0

    let revenue = 0
    if (invoicesResult.status === 'fulfilled' && invoicesResult.value.data) {
      revenue = invoicesResult.value.data.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
    }

    const tests_this_month = testsResult.status === 'fulfilled' 
      ? testsResult.value.count || 0 
      : 0

    const active_technicians = techniciansResult.status === 'fulfilled' 
      ? techniciansResult.value.count || 0 
      : 0

    return NextResponse.json({
      customers,
      devices,
      appointments,
      revenue,
      tests_this_month,
      active_technicians
    })
  } catch (error: any) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}