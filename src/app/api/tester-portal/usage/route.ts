import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/tester-portal/usage - Get API usage analytics
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(['admin'])(request)
    if (user instanceof NextResponse) return user

    // Get company ID from team user
    const { data: teamUser } = await supabase
      .from('team_users')
      .select('company_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!teamUser?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // 'day', 'week', 'month'

    // Calculate date range based on period
    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
        break
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // Get total API calls for the period
    const { data: usageData, count: totalCalls } = await supabase
      .from('api_usage_logs')
      .select('*', { count: 'exact' })
      .eq('company_id', teamUser.company_id)
      .gte('created_at', startDate.toISOString())

    // Get current hour rate limit usage
    const currentHour = new Date()
    currentHour.setMinutes(0, 0, 0)
    
    const { count: currentHourCalls } = await supabase
      .from('api_usage_logs')
      .select('*', { count: 'exact' })
      .eq('company_id', teamUser.company_id)
      .gte('created_at', currentHour.toISOString())

    // Get most used endpoints
    const { data: endpointUsage } = await supabase
      .from('api_usage_logs')
      .select('endpoint')
      .eq('company_id', teamUser.company_id)
      .gte('created_at', startDate.toISOString())

    // Count endpoint usage
    const endpointCounts: { [key: string]: number } = {}
    endpointUsage?.forEach(log => {
      endpointCounts[log.endpoint] = (endpointCounts[log.endpoint] || 0) + 1
    })

    const mostUsedEndpoints = Object.entries(endpointCounts)
      .map(([endpoint, calls]) => ({ endpoint, calls }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 10)

    // Get company plan for rate limits
    const { data: company } = await supabase
      .from('companies')
      .select('subscription_plan')
      .eq('id', teamUser.company_id)
      .single()

    const planLimits = {
      starter: { hourly: 1000, monthly: 10000 },
      professional: { hourly: 5000, monthly: 50000 },
      enterprise: { hourly: -1, monthly: -1 }
    }

    const currentPlan = company?.subscription_plan || 'starter'
    const limits = planLimits[currentPlan as keyof typeof planLimits] || planLimits.starter

    // Calculate usage by day for charts
    const dailyUsage: { [key: string]: number } = {}
    const last30Days = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))

    const { data: dailyData } = await supabase
      .from('api_usage_logs')
      .select('created_at')
      .eq('company_id', teamUser.company_id)
      .gte('created_at', last30Days.toISOString())

    dailyData?.forEach(log => {
      const date = new Date(log.created_at).toISOString().split('T')[0]
      dailyUsage[date] = (dailyUsage[date] || 0) + 1
    })

    // Get error rates
    const { data: errorData } = await supabase
      .from('api_usage_logs')
      .select('status_code')
      .eq('company_id', teamUser.company_id)
      .gte('created_at', startDate.toISOString())

    const successCount = errorData?.filter(log => log.status_code >= 200 && log.status_code < 300).length || 0
    const errorCount = errorData?.filter(log => log.status_code >= 400).length || 0
    const totalRequests = (errorData?.length || 0)
    const successRate = totalRequests > 0 ? (successCount / totalRequests * 100) : 100

    return NextResponse.json({
      data: {
        total_calls_today: period === 'day' ? totalCalls : currentHourCalls,
        total_calls_month: totalCalls,
        rate_limit_remaining: limits.hourly > 0 ? Math.max(0, limits.hourly - (currentHourCalls || 0)) : -1,
        most_used_endpoints: mostUsedEndpoints,
        daily_usage: Object.entries(dailyUsage).map(([date, calls]) => ({ date, calls })),
        success_rate: Math.round(successRate * 100) / 100,
        error_count: errorCount,
        plan_limits: limits,
        current_period: {
          start: startDate.toISOString(),
          end: now.toISOString(),
          total_calls: totalCalls
        }
      }
    })

  } catch (error) {
    console.error('Usage API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}