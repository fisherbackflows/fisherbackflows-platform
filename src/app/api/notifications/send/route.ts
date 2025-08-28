import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase'
import webpush from 'web-push'

// Configure web-push with VAPID keys only if they are properly set
function configureWebPush() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  
  if (vapidPublicKey && vapidPrivateKey && 
      vapidPublicKey !== 'BEl62iUYgUivxIkv69yViEuiBIa40HI6YUTpZrLZjkRgF9n7X7wgqz6rS1WdAPHBSqLZswRk6Q4_dNa_gU7WGwE' &&
      vapidPrivateKey !== 'your-vapid-private-key') {
    webpush.setVapidDetails(
      'mailto:fisherbackflows@gmail.com',
      vapidPublicKey,
      vapidPrivateKey
    )
    return true
  }
  return false
}

export async function POST(request: NextRequest) {
  try {
    // Check if web push is configured
    const isWebPushConfigured = configureWebPush()
    
    const body = await request.json()
    const { 
      userId, 
      title, 
      message, 
      type = 'general',
      data = {},
      actions = [],
      targetUrl,
      requireInteraction = false 
    } = body

    const supabase = createRouteHandlerClient(request)

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get push subscriptions for the target user (or all admin users if no specific user)
    let subscriptionsQuery = supabase
      .from('push_subscriptions')
      .select('*')

    if (userId) {
      subscriptionsQuery = subscriptionsQuery.eq('user_id', userId)
    } else {
      // Send to all admin/technician users if no specific user
      const { data: adminUsers } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'technician'])
      
      const adminIds = adminUsers?.map(u => u.id) || []
      if (adminIds.length > 0) {
        subscriptionsQuery = subscriptionsQuery.in('user_id', adminIds)
      }
    }

    const { data: subscriptions, error: subError } = await subscriptionsQuery

    if (subError) {
      console.error('Error fetching subscriptions:', subError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch subscriptions' },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for notification')
      return NextResponse.json({
        success: true,
        message: 'No active subscriptions found',
        sent: 0
      })
    }

    // Generate tracking ID for analytics
    const trackingId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Prepare notification payload
    const notificationPayload = {
      title,
      body: message,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      tag: `${type}_${trackingId}`,
      requireInteraction,
      data: {
        ...data,
        type,
        url: targetUrl,
        trackingId,
        timestamp: Date.now()
      },
      actions: actions.length > 0 ? actions : [
        {
          action: 'view',
          title: 'View Details',
          icon: '/icons/view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/close.png'
        }
      ]
    }

    // Send push notifications to all subscriptions
    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth
          }
        }

        if (isWebPushConfigured) {
          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(notificationPayload),
            {
              TTL: 86400, // 24 hours
              urgency: type === 'urgent' ? 'high' : 'normal'
            }
          )
        } else {
          console.log('Web push not configured - notification logged only')
        }

        console.log(`Notification sent to ${subscription.user_id}`)
        return { success: true, userId: subscription.user_id }

      } catch (error) {
        console.error(`Failed to send notification to ${subscription.user_id}:`, error)
        
        // Remove invalid subscriptions (410 Gone)
        if (error.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', subscription.endpoint)
        }

        return { success: false, userId: subscription.user_id, error: error.message }
      }
    })

    const results = await Promise.all(sendPromises)
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    // Log notification to database for analytics
    await supabase
      .from('notification_logs')
      .insert({
        tracking_id: trackingId,
        type,
        title,
        message,
        target_user_id: userId,
        sent_count: successful,
        failed_count: failed,
        payload: notificationPayload,
        created_at: new Date().toISOString(),
        created_by: user.id
      })

    console.log(`Notification sent: ${successful} successful, ${failed} failed`)

    return NextResponse.json({
      success: true,
      trackingId,
      sent: successful,
      failed,
      results: results.map(r => ({
        userId: r.userId,
        success: r.success,
        error: r.error
      }))
    })

  } catch (error) {
    console.error('Error sending push notification:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve notification history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = createRouteHandlerClient(request)

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get notification history
    const { data: notifications, error } = await supabase
      .from('notification_logs')
      .select(`
        *,
        profiles!created_by (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      pagination: {
        limit,
        offset,
        hasMore: notifications?.length === limit
      }
    })

  } catch (error) {
    console.error('Error in notifications GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}