// Push notification system for Fisher Backflows automation platform
import { createClientComponentClient } from '@/lib/supabase'

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, any>
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

export interface NotificationSubscription {
  userId: string
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  userAgent?: string
  createdAt: string
}

// Service Worker registration and push subscription
export class NotificationManager {
  private static instance: NotificationManager
  private swRegistration: ServiceWorkerRegistration | null = null
  private supabase = createClientComponentClient()

  private constructor() {}

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager()
    }
    return NotificationManager.instance
  }

  // Initialize service worker and request permissions
  async initialize(): Promise<boolean> {
    try {
      // Check if notifications are supported
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        console.warn('Push messaging is not supported')
        return false
      }

      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered successfully')

      // Request notification permission
      const permission = await this.requestPermission()
      if (permission !== 'granted') {
        console.warn('Notification permission not granted')
        return false
      }

      // Subscribe to push notifications
      await this.subscribeToPush()
      return true

    } catch (error) {
      console.error('Error initializing notifications:', error)
      return false
    }
  }

  // Request notification permission from user
  async requestPermission(): Promise<NotificationPermission> {
    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission
    }

    return Notification.permission
  }

  // Subscribe to push notifications
  async subscribeToPush(): Promise<PushSubscription | null> {
    try {
      if (!this.swRegistration) {
        throw new Error('Service Worker not registered')
      }

      // Check for existing subscription
      let subscription = await this.swRegistration.pushManager.getSubscription()

      if (!subscription) {
        // Create new subscription
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_KEY
        if (!vapidPublicKey) {
          throw new Error('Missing NEXT_PUBLIC_VAPID_KEY for push notifications')
        }
        
        subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
        })

        console.log('Push subscription created:', subscription.endpoint)
      }

      // Save subscription to database
      await this.saveSubscription(subscription)
      return subscription

    } catch (error) {
      console.error('Error subscribing to push:', error)
      return null
    }
  }

  // Save push subscription to Supabase
  private async saveSubscription(subscription: PushSubscription) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) return

      const subscriptionData: NotificationSubscription = {
        userId: user.id,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        },
        userAgent: navigator.userAgent,
        createdAt: new Date().toISOString()
      }

      // Upsert subscription (update if exists, insert if new)
      const { error } = await this.supabase
        .from('push_subscriptions')
        .upsert(subscriptionData, {
          onConflict: 'user_id,endpoint'
        })

      if (error) {
        console.error('Error saving subscription:', error)
      } else {
        console.log('Push subscription saved successfully')
      }

    } catch (error) {
      console.error('Error in saveSubscription:', error)
    }
  }

  // Send local notification (for immediate feedback)
  async showLocalNotification(payload: NotificationPayload) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192.png',
        badge: payload.badge || '/icons/badge-72.png',
        tag: payload.tag,
        data: payload.data,
        actions: payload.actions,
        requireInteraction: true
      })

      // Auto-close after 10 seconds if not interacted with
      setTimeout(() => notification.close(), 10000)

      return notification
    }
  }

  // Utility functions
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.swRegistration) {
        return false
      }

      const subscription = await this.swRegistration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        
        // Remove from database
        const { data: { user } } = await this.supabase.auth.getUser()
        if (user) {
          await this.supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', subscription.endpoint)
        }

        console.log('Unsubscribed from push notifications')
        return true
      }
      return false

    } catch (error) {
      console.error('Error unsubscribing:', error)
      return false
    }
  }
}

// Predefined notification templates for common automation events
export const NotificationTemplates = {
  testCompleted: (customerName: string, result: 'Passed' | 'Failed' | 'Needs Repair'): NotificationPayload => ({
    title: `Test Completed - ${result}`,
    body: `${customerName}'s backflow test ${result.toLowerCase()}. ${result === 'Passed' ? 'Invoice generated automatically.' : 'Customer will be notified of required repairs.'}`,
    icon: '/icons/test-complete.png',
    tag: 'test-completed',
    data: { type: 'test_completed', customerName, result },
    actions: [
      { action: 'view-report', title: 'View Report' },
      { action: 'contact-customer', title: 'Contact Customer' }
    ]
  }),

  paymentReceived: (customerName: string, amount: number): NotificationPayload => ({
    title: 'Payment Received',
    body: `$${amount.toFixed(2)} payment received from ${customerName}`,
    icon: '/icons/payment.png',
    tag: 'payment-received',
    data: { type: 'payment_received', customerName, amount },
    actions: [
      { action: 'view-payment', title: 'View Details' }
    ]
  }),

  appointmentScheduled: (customerName: string, date: string): NotificationPayload => ({
    title: 'Appointment Scheduled',
    body: `New appointment scheduled for ${customerName} on ${date}`,
    icon: '/icons/calendar.png',
    tag: 'appointment-scheduled',
    data: { type: 'appointment_scheduled', customerName, date },
    actions: [
      { action: 'view-schedule', title: 'View Schedule' },
      { action: 'prepare-route', title: 'Plan Route' }
    ]
  }),

  overdueInvoice: (customerName: string, amount: number, daysPastDue: number): NotificationPayload => ({
    title: 'Invoice Overdue',
    body: `${customerName} has an overdue invoice of $${amount.toFixed(2)} (${daysPastDue} days past due)`,
    icon: '/icons/warning.png',
    tag: 'invoice-overdue',
    data: { type: 'invoice_overdue', customerName, amount, daysPastDue },
    actions: [
      { action: 'send-reminder', title: 'Send Reminder' },
      { action: 'call-customer', title: 'Call Customer' }
    ]
  }),

  systemAlert: (message: string, severity: 'info' | 'warning' | 'error' = 'info'): NotificationPayload => ({
    title: severity === 'error' ? 'System Error' : severity === 'warning' ? 'System Warning' : 'System Alert',
    body: message,
    icon: '/icons/system.png',
    tag: 'system-alert',
    data: { type: 'system_alert', severity, message },
    actions: [
      { action: 'view-dashboard', title: 'View Dashboard' }
    ]
  }),

  reminderDue: (customerName: string, serviceType: string, dueDate: string): NotificationPayload => ({
    title: 'Service Reminder Due',
    body: `${customerName} needs ${serviceType} by ${dueDate}`,
    icon: '/icons/reminder.png',
    tag: 'reminder-due',
    data: { type: 'reminder_due', customerName, serviceType, dueDate },
    actions: [
      { action: 'schedule-appointment', title: 'Schedule Now' },
      { action: 'send-notice', title: 'Send Notice' }
    ]
  })
}

// Initialize notifications when module loads (browser only)
if (typeof window !== 'undefined') {
  const notificationManager = NotificationManager.getInstance()
  
  // Auto-initialize on page load
  window.addEventListener('load', () => {
    notificationManager.initialize().catch(console.error)
  })
}
