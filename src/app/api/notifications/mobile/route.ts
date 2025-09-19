import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs';
import { createRouteHandlerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request)
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const userType = searchParams.get('userType') || 'customer'
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter required' },
        { status: 400 }
      )
    }

    // Get notifications based on user type
    let notifications: any[] = []

    if (userType === 'customer') {
      // Customer notifications: appointments, payments, system alerts
      const { data: customerNotifications, error } = await supabase
        .from('customer_notifications')
        .select('*')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      notifications = customerNotifications || []

    } else if (userType === 'technician') {
      // Technician notifications: assignments, schedule changes, customer updates
      const { data: techNotifications, error } = await supabase
        .from('technician_notifications')
        .select('*')
        .eq('technician_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      notifications = techNotifications || []

    } else if (userType === 'admin') {
      // Admin notifications: system alerts, business metrics, staff updates
      const { data: adminNotifications, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .eq('admin_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      notifications = adminNotifications || []
    }

    // Transform to unified notification format
    const unifiedNotifications = notifications.map(n => ({
      id: n.id,
      type: n.notification_type || 'system',
      title: n.title,
      message: n.message || n.body,
      timestamp: n.created_at,
      read: n.read_at !== null,
      actionUrl: n.action_url,
      actionLabel: n.action_label,
      priority: n.priority || 'normal',
      expires: n.expires_at,
      data: n.metadata || {}
    }))

    // Add contextual notifications based on user type and current data
    const contextualNotifications = await generateContextualNotifications(supabase, userId, userType)
    
    const allNotifications = [...unifiedNotifications, ...contextualNotifications]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      notifications: allNotifications,
      unreadCount: allNotifications.filter(n => !n.read).length,
      total: allNotifications.length
    })

  } catch (error) {
    console.error('Mobile notifications API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(request)
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      userId,
      userType,
      type,
      title,
      message,
      priority = 'normal',
      actionUrl,
      actionLabel,
      expiresAt,
      metadata = {}
    } = await request.json()

    // Validate required fields
    if (!userId || !userType || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const notificationData = {
      notification_type: type,
      title,
      message,
      priority,
      action_url: actionUrl,
      action_label: actionLabel,
      expires_at: expiresAt,
      metadata,
      created_at: new Date().toISOString()
    }

    let result
    if (userType === 'customer') {
      const { data, error } = await supabase
        .from('customer_notifications')
        .insert({
          ...notificationData,
          customer_id: userId
        })
        .select()
        .single()

      if (error) throw error
      result = data

    } else if (userType === 'technician') {
      const { data, error } = await supabase
        .from('technician_notifications')
        .insert({
          ...notificationData,
          technician_id: userId
        })
        .select()
        .single()

      if (error) throw error
      result = data

    } else if (userType === 'admin') {
      const { data, error } = await supabase
        .from('admin_notifications')
        .insert({
          ...notificationData,
          admin_id: userId
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    // Send push notification if user has subscription
    await sendPushNotification(supabase, userId, {
      title,
      message,
      priority,
      actionUrl,
      metadata
    })

    return NextResponse.json({
      success: true,
      notification: result
    })

  } catch (error) {
    console.error('Create notification error:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

async function generateContextualNotifications(supabase: any, userId: string, userType: string) {
  const contextualNotifications: any[] = []

  try {
    if (userType === 'customer') {
      // Check for upcoming appointments
      const { data: upcomingAppointments } = await supabase
        .from('appointments')
        .select('id, appointment_date, appointment_time, status')
        .eq('customer_id', userId)
        .gte('appointment_date', new Date().toISOString().split('T')[0])
        .lte('appointment_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .eq('status', 'confirmed')

      upcomingAppointments?.forEach(appointment => {
        const appointmentDate = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`)
        const hoursUntil = Math.round((appointmentDate.getTime() - Date.now()) / (1000 * 60 * 60))
        
        if (hoursUntil <= 24 && hoursUntil > 0) {
          contextualNotifications.push({
            id: `reminder_${appointment.id}`,
            type: 'appointment',
            title: 'Appointment Tomorrow',
            message: `Your backflow test is scheduled for ${appointment.appointment_time}`,
            timestamp: new Date().toISOString(),
            read: false,
            actionUrl: `/portal/schedule`,
            actionLabel: 'View Details',
            priority: hoursUntil <= 2 ? 'high' : 'normal',
            data: { appointmentId: appointment.id }
          })
        }
      })

      // Check for overdue payments
      const { data: overdueInvoices } = await supabase
        .from('invoices')
        .select('id, amount_due, due_date')
        .eq('customer_id', userId)
        .eq('status', 'sent')
        .lt('due_date', new Date().toISOString().split('T')[0])

      if (overdueInvoices?.length > 0) {
        const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.amount_due, 0)
        contextualNotifications.push({
          id: `overdue_payment`,
          type: 'payment',
          title: 'Payment Overdue',
          message: `You have ${overdueInvoices.length} overdue invoice(s) totaling $${totalOverdue}`,
          timestamp: new Date().toISOString(),
          read: false,
          actionUrl: `/portal/billing`,
          actionLabel: 'Pay Now',
          priority: 'high',
          data: { invoiceCount: overdueInvoices.length, totalAmount: totalOverdue }
        })
      }

    } else if (userType === 'technician') {
      // Check for today's appointments
      const today = new Date().toISOString().split('T')[0]
      const { data: todayAppointments } = await supabase
        .from('appointments')
        .select('id, customer_name, appointment_time, address')
        .eq('technician_id', userId)
        .eq('appointment_date', today)
        .in('status', ['confirmed', 'scheduled'])

      if (todayAppointments?.length > 0) {
        contextualNotifications.push({
          id: `daily_schedule`,
          type: 'appointment',
          title: `${todayAppointments.length} Appointments Today`,
          message: `Your first appointment is at ${todayAppointments[0].appointment_time}`,
          timestamp: new Date().toISOString(),
          read: false,
          actionUrl: `/field/dashboard`,
          actionLabel: 'View Schedule',
          priority: 'normal',
          data: { appointmentCount: todayAppointments.length }
        })
      }

      // Check for route optimization opportunities
      if (todayAppointments?.length > 2) {
        contextualNotifications.push({
          id: `route_optimization`,
          type: 'location',
          title: 'Route Optimization Available',
          message: 'Optimize your route to save time and fuel',
          timestamp: new Date().toISOString(),
          read: false,
          actionUrl: `/field/dashboard?optimize=true`,
          actionLabel: 'Optimize Route',
          priority: 'low',
          data: { appointmentCount: todayAppointments.length }
        })
      }
    }

  } catch (error) {
    console.error('Error generating contextual notifications:', error)
  }

  return contextualNotifications
}

async function sendPushNotification(supabase: any, userId: string, notification: any) {
  try {
    // Get user's push subscription
    const { data: subscription } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .eq('active', true)
      .single()

    if (subscription?.subscription) {
      // Send push notification via our push service
      await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.subscription,
          title: notification.title,
          message: notification.message,
          data: {
            url: notification.actionUrl,
            ...notification.metadata
          }
        })
      })
    }
  } catch (error) {
    console.error('Push notification error:', error)
  }
}