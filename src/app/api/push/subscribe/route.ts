import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json()
    const supabase = createRouteHandlerClient(request)

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Store push subscription in database
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        subscription: subscription,
        created_at: new Date().toISOString(),
        active: true
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Error storing push subscription:', error)
      return NextResponse.json({ error: 'Failed to store subscription' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Push subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request)

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Deactivate push subscription
    const { error } = await supabase
      .from('push_subscriptions')
      .update({ active: false })
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deactivating push subscription:', error)
      return NextResponse.json({ error: 'Failed to deactivate subscription' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Push unsubscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}