import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { trackingId, action, timestamp } = body

    if (!trackingId || !action) {
      return NextResponse.json(
        { success: false, error: 'trackingId and action are required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Log the notification interaction
    const { error: insertError } = await supabase
      .from('notification_interactions')
      .insert({
        tracking_id: trackingId,
        action,
        timestamp: new Date(timestamp || Date.now()).toISOString(),
        user_agent: request.headers.get('user-agent') || '',
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
      })

    if (insertError) {
      console.error('Error logging notification interaction:', insertError)
      // Don't fail the request if logging fails
    }

    // Update the main notification log with interaction stats
    const { error: updateError } = await supabase.rpc('update_notification_stats', {
      p_tracking_id: trackingId,
      p_action: action
    })

    if (updateError) {
      console.warn('Error updating notification stats:', updateError)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Interaction tracked successfully'
    })

  } catch (error) {
    console.error('Error tracking notification:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}