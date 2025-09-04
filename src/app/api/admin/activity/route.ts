import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const supabase = createRouteHandlerClient(request)

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
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
    console.error('Error in activity API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}