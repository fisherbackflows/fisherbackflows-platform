import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs';
import { createRouteHandlerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    // SECURITY FIX: Validate and bound limit parameter
    const limitParam = searchParams.get('limit') || '10'
    const limit = Math.min(Math.max(parseInt(limitParam) || 10, 1), 100) // Bound between 1-100
    
    const supabase = createRouteHandlerClient(request)

    // Get the current user and verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // SECURITY FIX: Verify user is admin
    const { data: profile } = await supabase
      .from('team_users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Simple mock activities for now - real data integration can be added later
    const activities = [
      {
        id: '1',
        type: 'system',
        icon: 'Activity',
        text: 'System dashboard loaded - connect your data sources to see real metrics',
        time: 'Just now',
        timestamp: new Date().toISOString()
      }
    ]

    return NextResponse.json({
      success: true,
      activities: activities.slice(0, limit)
    })

  } catch (error) {
    // SECURITY FIX: Remove console.error in production
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}