import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import webpush from 'web-push'

// Configure web-push (only if keys are available)
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@fisherbackflows.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  url?: string
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  data?: Record<string, any>
  requireInteraction?: boolean
  silent?: boolean
  trackingId?: string
}

export async function POST(request: NextRequest) {
  try {
    // Check if push notifications are configured
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return NextResponse.json({ 
        error: 'Push notifications not configured. Please set VAPID keys.' 
      }, { status: 503 })
    }

    const { 
      userIds, 
      payload,
      sendToAll = false 
    }: {
      userIds?: string[]
      payload: PushNotificationPayload
      sendToAll?: boolean
    } = await request.json()

    const supabase = createRouteHandlerClient(request)

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('team_users')
      .select('role')
      .eq('email', user.email)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get push subscriptions
    let query = supabase
      .from('push_subscriptions')
      .select('*')
      .eq('active', true)

    if (!sendToAll && userIds && userIds.length > 0) {
      query = query.in('user_id', userIds)
    }

    const { data: subscriptions, error } = await query

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ 
        message: 'No active subscriptions found', 
        sent: 0 
      })
    }

    // Prepare notification payload
    const notificationPayload = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/badge-72.png',
      image: payload.image,
      tag: payload.tag || 'fisher-backflows',
      url: payload.url || '/',
      data: {
        ...payload.data,
        timestamp: Date.now(),
        trackingId: payload.trackingId || `notification-${Date.now()}`
      },
      actions: payload.actions || [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/close.png'
        }
      ],
      requireInteraction: payload.requireInteraction || false,
      silent: payload.silent || false
    }

    // Send notifications
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          sub.subscription,
          JSON.stringify(notificationPayload),
          {
            TTL: 86400, // 24 hours
            urgency: 'normal'
          }
        )
        return { success: true, userId: sub.user_id }
      } catch (error: any) {
        console.error(`Failed to send notification to ${sub.user_id}:`, error)
        
        // Remove invalid subscriptions
        if (error.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .update({ active: false })
            .eq('id', sub.id)
        }
        
        return { success: false, userId: sub.user_id, error: error.message }
      }
    })

    const results = await Promise.all(sendPromises)
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    // Log notification
    await supabase
      .from('notification_logs')
      .insert({
        title: payload.title,
        body: payload.body,
        sent_count: successful,
        failed_count: failed,
        sent_by: user.id,
        tracking_id: notificationPayload.data.trackingId,
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      message: 'Notifications processed',
      sent: successful,
      failed: failed,
      total: subscriptions.length,
      trackingId: notificationPayload.data.trackingId
    })

  } catch (error) {
    console.error('Push notification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}