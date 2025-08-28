import { createClientComponentClient } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface RealtimeSubscription {
  channel: RealtimeChannel
  unsubscribe: () => void
}

// Real-time appointment updates
export function subscribeToAppointments(
  callback: (appointment: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => void,
  filters?: { customerId?: string; technicianId?: string; date?: string }
): RealtimeSubscription | null {
  try {
    const supabase = createClientComponentClient()
    
    let channel = supabase.channel('appointments-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: filters?.customerId ? `customer_id=eq.${filters.customerId}` : undefined
      }, (payload) => {
        console.log('📅 Appointment update:', payload)
        callback(payload.new || payload.old, payload.eventType as any)
      })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to appointment updates')
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Error subscribing to appointments')
      }
    })

    return {
      channel,
      unsubscribe: () => {
        channel.unsubscribe()
        console.log('🔌 Unsubscribed from appointment updates')
      }
    }

  } catch (error) {
    console.error('Error setting up appointment subscription:', error)
    return null
  }
}

// Real-time test report updates
export function subscribeToTestReports(
  callback: (testReport: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => void,
  customerId?: string
): RealtimeSubscription | null {
  try {
    const supabase = createClientComponentClient()
    
    let channel = supabase.channel('test-reports-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'test_reports',
        filter: customerId ? `customer_id=eq.${customerId}` : undefined
      }, (payload) => {
        console.log('🔬 Test report update:', payload)
        callback(payload.new || payload.old, payload.eventType as any)
      })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to test report updates')
      }
    })

    return {
      channel,
      unsubscribe: () => {
        channel.unsubscribe()
        console.log('🔌 Unsubscribed from test report updates')
      }
    }

  } catch (error) {
    console.error('Error setting up test report subscription:', error)
    return null
  }
}

// Real-time invoice updates
export function subscribeToInvoices(
  callback: (invoice: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => void,
  customerId?: string
): RealtimeSubscription | null {
  try {
    const supabase = createClientComponentClient()
    
    let channel = supabase.channel('invoices-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'invoices',
        filter: customerId ? `customer_id=eq.${customerId}` : undefined
      }, (payload) => {
        console.log('💰 Invoice update:', payload)
        callback(payload.new || payload.old, payload.eventType as any)
      })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to invoice updates')
      }
    })

    return {
      channel,
      unsubscribe: () => {
        channel.unsubscribe()
        console.log('🔌 Unsubscribed from invoice updates')
      }
    }

  } catch (error) {
    console.error('Error setting up invoice subscription:', error)
    return null
  }
}

// Real-time payment updates
export function subscribeToPayments(
  callback: (payment: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => void,
  customerId?: string
): RealtimeSubscription | null {
  try {
    const supabase = createClientComponentClient()
    
    let channel = supabase.channel('payments-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'payments',
        filter: customerId ? `customer_id=eq.${customerId}` : undefined
      }, (payload) => {
        console.log('💳 Payment update:', payload)
        callback(payload.new || payload.old, payload.eventType as any)
      })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to payment updates')
      }
    })

    return {
      channel,
      unsubscribe: () => {
        channel.unsubscribe()
        console.log('🔌 Unsubscribed from payment updates')
      }
    }

  } catch (error) {
    console.error('Error setting up payment subscription:', error)
    return null
  }
}

// Real-time system notifications
export function subscribeToNotifications(
  callback: (notification: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => void,
  userId?: string
): RealtimeSubscription | null {
  try {
    const supabase = createClientComponentClient()
    
    let channel = supabase.channel('notifications-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: userId ? `user_id=eq.${userId}` : undefined
      }, (payload) => {
        console.log('🔔 New notification:', payload)
        callback(payload.new, 'INSERT')
      })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to notifications')
      }
    })

    return {
      channel,
      unsubscribe: () => {
        channel.unsubscribe()
        console.log('🔌 Unsubscribed from notifications')
      }
    }

  } catch (error) {
    console.error('Error setting up notification subscription:', error)
    return null
  }
}

// Utility: Subscribe to multiple tables at once
export function subscribeToMultiple(
  subscriptions: Array<{
    table: string
    callback: (data: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => void
    filter?: string
  }>
): RealtimeSubscription | null {
  try {
    const supabase = createClientComponentClient()
    
    let channel = supabase.channel('multi-table-changes')

    subscriptions.forEach(({ table, callback, filter }) => {
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table,
        filter
      }, (payload) => {
        console.log(`📊 ${table} update:`, payload)
        callback(payload.new || payload.old, payload.eventType as any)
      })
    })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to multiple table updates')
      }
    })

    return {
      channel,
      unsubscribe: () => {
        channel.unsubscribe()
        console.log('🔌 Unsubscribed from multiple table updates')
      }
    }

  } catch (error) {
    console.error('Error setting up multiple subscriptions:', error)
    return null
  }
}

// Utility: Clean up all subscriptions
export function cleanupAllSubscriptions(subscriptions: RealtimeSubscription[]) {
  subscriptions.forEach(sub => {
    try {
      sub.unsubscribe()
    } catch (error) {
      console.error('Error cleaning up subscription:', error)
    }
  })
}