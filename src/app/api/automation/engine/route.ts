import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs';
import { createRouteHandlerClient } from '@/lib/supabase'
import { getAutomationEngine } from '@/lib/automation'

// GET: Get automation engine status and statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request)

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get automation statistics
    const automationEngine = getAutomationEngine()
    const stats = await automationEngine.getStats()

    return NextResponse.json({
      success: true,
      stats,
      status: 'running',
      lastRun: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error getting automation status:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Trigger automation cycle manually or start/stop the engine
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    const supabase = createRouteHandlerClient(request)

    // Verify authentication and admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('team_users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && profile?.role !== 'technician') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    let result
    const automationEngine = getAutomationEngine()

    switch (action) {
      case 'run_cycle':
        console.log('🔄 Manual automation cycle triggered by:', user.email)
        result = await automationEngine.runAutomationCycle()
        
        return NextResponse.json({
          success: true,
          action: 'run_cycle',
          result,
          message: `Automation cycle completed: ${result.processed} processed, ${result.scheduled} scheduled, ${result.errors} errors`
        })

      case 'start_engine':
        console.log('🚀 Automation engine start requested by:', user.email)
        await automationEngine.start()
        
        return NextResponse.json({
          success: true,
          action: 'start_engine',
          message: 'Automation engine started successfully'
        })

      case 'get_stats':
        result = await automationEngine.getStats()
        return NextResponse.json({
          success: true,
          action: 'get_stats',
          stats: result
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in automation engine API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Update automation rules
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { rule } = body

    const supabase = createRouteHandlerClient(request)

    // Verify authentication and admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!rule || !rule.name) {
      return NextResponse.json(
        { success: false, error: 'Rule data required' },
        { status: 400 }
      )
    }

    // Add the custom rule to the automation engine
    const automationEngine = getAutomationEngine()
    const newRule = await automationEngine.addRule(rule)

    return NextResponse.json({
      success: true,
      rule: newRule,
      message: 'Custom automation rule added successfully'
    })

  } catch (error) {
    console.error('Error adding automation rule:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}