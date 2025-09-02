import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import { AnalyticsEngine } from '@/lib/analytics/metrics'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request)
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has analytics access
    const { data: profile } = await supabase
      .from('team_users')
      .select('role')
      .eq('email', user.email)
      .single()

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const timeframe = searchParams.get('timeframe') || '30'

    const analytics = new AnalyticsEngine(request)

    // Calculate comprehensive metrics
    const [
      businessMetrics,
      timeSeriesData,
      topCustomers,
      forecast,
      insights
    ] = await Promise.all([
      analytics.calculateBusinessMetrics(startDate || undefined, endDate || undefined),
      analytics.getTimeSeriesData(parseInt(timeframe)),
      analytics.getTopCustomers(10),
      analytics.getRevenueForecast(6),
      analytics.getOperationalInsights()
    ])

    const dashboardData = {
      metrics: businessMetrics,
      timeSeries: timeSeriesData,
      topCustomers,
      forecast,
      insights,
      lastUpdated: new Date().toISOString(),
      dataRange: {
        start: startDate || new Date(Date.now() - parseInt(timeframe) * 24 * 60 * 60 * 1000).toISOString(),
        end: endDate || new Date().toISOString()
      }
    }

    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('Analytics dashboard error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch analytics data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}