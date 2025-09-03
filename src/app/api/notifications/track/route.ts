import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { 
      trackingId, 
      action, 
      timestamp 
    } = await request.json()

    if (!trackingId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient(request)

    // Store notification interaction
    const { error } = await supabase
      .from('notification_interactions')
      .insert({
        tracking_id: trackingId,
        action: action,
        timestamp: new Date(timestamp).toISOString(),
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error tracking notification:', error)
      return NextResponse.json({ error: 'Failed to track notification' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Notification tracking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}