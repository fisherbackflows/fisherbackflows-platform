/**
 * Real-time Client
 * Manages WebSocket connections and real-time updates
 */

import { createClient } from '@supabase/supabase-js';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeEvent<T = any> {
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | null;
  old: T | null;
  eventType: string;
  schema: string;
  table: string;
}

export interface RealtimeSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

class RealtimeManager {
  private supabase: any;
  private subscriptions = new Map<string, RealtimeChannel>();
  private connectionStatus: 'connecting' | 'connected' | 'disconnected' = 'disconnected';
  private statusCallbacks = new Set<(status: string) => void>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      this.setupStatusMonitoring();
    }
  }

  private setupStatusMonitoring() {
    // Monitor connection status
    this.supabase.channel('heartbeat')
      .on('postgres_changes', { event: '*', schema: '*' }, () => {
        // This won't fire, but establishes connection
      })
      .subscribe((status: string) => {
        this.connectionStatus = status === 'SUBSCRIBED' ? 'connected' : 'disconnected';
        this.notifyStatusChange();
      });
  }

  private notifyStatusChange() {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(this.connectionStatus);
      } catch (error) {
        console.error('Error in status callback:', error);
      }
    });
  }

  /**
   * Subscribe to appointment updates
   */
  subscribeToAppointments(
    callback: (event: RealtimeEvent) => void,
    filters?: { customerId?: string; technicianId?: string }
  ): RealtimeSubscription {
    const channelName = `appointments:${Date.now()}`;
    const channel = this.supabase.channel(channelName);

    const query = channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'appointments' },
      (payload: any) => {
        // Apply client-side filters if provided
        if (filters) {
          if (filters.customerId && payload.new?.customer_id !== filters.customerId) {
            return;
          }
          if (filters.technicianId && payload.new?.technician_id !== filters.technicianId) {
            return;
          }
        }

        callback({
          event: payload.eventType,
          new: payload.new,
          old: payload.old,
          eventType: payload.eventType,
          schema: payload.schema,
          table: payload.table
        });
      }
    );

    channel.subscribe();
    this.subscriptions.set(channelName, channel);

    return {
      channel,
      unsubscribe: () => this.unsubscribe(channelName)
    };
  }

  /**
   * Subscribe to test report updates
   */
  subscribeToTestReports(
    callback: (event: RealtimeEvent) => void,
    filters?: { customerId?: string; deviceId?: string }
  ): RealtimeSubscription {
    const channelName = `test_reports:${Date.now()}`;
    const channel = this.supabase.channel(channelName);

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'test_reports' },
      (payload: any) => {
        // Apply filters
        if (filters) {
          if (filters.customerId && payload.new?.customer_id !== filters.customerId) {
            return;
          }
          if (filters.deviceId && payload.new?.device_id !== filters.deviceId) {
            return;
          }
        }

        callback({
          event: payload.eventType,
          new: payload.new,
          old: payload.old,
          eventType: payload.eventType,
          schema: payload.schema,
          table: payload.table
        });
      }
    );

    channel.subscribe();
    this.subscriptions.set(channelName, channel);

    return {
      channel,
      unsubscribe: () => this.unsubscribe(channelName)
    };
  }

  /**
   * Subscribe to invoice/payment updates
   */
  subscribeToPayments(
    callback: (event: RealtimeEvent) => void,
    customerId?: string
  ): RealtimeSubscription {
    const channelName = `payments:${Date.now()}`;
    const channel = this.supabase.channel(channelName);

    // Subscribe to both invoices and payments
    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        (payload: any) => {
          if (customerId && payload.new?.customer_id !== customerId) return;
          callback({
            event: payload.eventType,
            new: payload.new,
            old: payload.old,
            eventType: payload.eventType,
            schema: payload.schema,
            table: payload.table
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        (payload: any) => {
          if (customerId && payload.new?.customer_id !== customerId) return;
          callback({
            event: payload.eventType,
            new: payload.new,
            old: payload.old,
            eventType: payload.eventType,
            schema: payload.schema,
            table: payload.table
          });
        }
      );

    channel.subscribe();
    this.subscriptions.set(channelName, channel);

    return {
      channel,
      unsubscribe: () => this.unsubscribe(channelName)
    };
  }

  /**
   * Subscribe to system notifications
   */
  subscribeToNotifications(
    callback: (notification: any) => void,
    userId?: string
  ): RealtimeSubscription {
    const channelName = `notifications:${Date.now()}`;
    const channel = this.supabase.channel(channelName);

    // Create a broadcast channel for notifications
    channel
      .on('broadcast', { event: 'notification' }, (payload: any) => {
        if (userId && payload.userId !== userId) return;
        callback(payload);
      })
      .subscribe();

    this.subscriptions.set(channelName, channel);

    return {
      channel,
      unsubscribe: () => this.unsubscribe(channelName)
    };
  }

  /**
   * Send real-time notification
   */
  async sendNotification(
    channelName: string,
    notification: {
      type: string;
      title: string;
      message: string;
      userId?: string;
      data?: any;
    }
  ) {
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'notification',
        payload: {
          ...notification,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Subscribe to presence (online users)
   */
  subscribeToPresence(
    callback: (presenceState: any) => void,
    room: string = 'general'
  ): RealtimeSubscription {
    const channelName = `presence:${room}`;
    const channel = this.supabase.channel(channelName, {
      config: {
        presence: {
          key: `user:${Date.now()}`
        }
      }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        callback(presenceState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe();

    this.subscriptions.set(channelName, channel);

    return {
      channel,
      unsubscribe: () => this.unsubscribe(channelName)
    };
  }

  /**
   * Update user presence
   */
  async updatePresence(room: string, userData: any) {
    const channelName = `presence:${room}`;
    const channel = this.subscriptions.get(channelName);
    
    if (channel) {
      await channel.track({
        user: userData.name || 'Anonymous',
        role: userData.role || 'user',
        status: 'online',
        lastSeen: new Date().toISOString()
      });
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): string {
    return this.connectionStatus;
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(callback: (status: string) => void): () => void {
    this.statusCallbacks.add(callback);
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Unsubscribe from a channel
   */
  private unsubscribe(channelName: string) {
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.subscriptions.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll() {
    this.subscriptions.forEach((channel, channelName) => {
      channel.unsubscribe();
    });
    this.subscriptions.clear();
  }

  /**
   * Health check - ping the server
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('customers')
        .select('count')
        .limit(1);
      
      return !error;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Create singleton instance
export const realtimeManager = new RealtimeManager();

// React hook for real-time updates
export function useRealtimeSubscription<T>(
  table: string,
  callback: (event: RealtimeEvent<T>) => void,
  filters?: any
) {
  const [subscription, setSubscription] = React.useState<RealtimeSubscription | null>(null);

  React.useEffect(() => {
    let sub: RealtimeSubscription | null = null;

    // Subscribe based on table
    switch (table) {
      case 'appointments':
        sub = realtimeManager.subscribeToAppointments(callback, filters);
        break;
      case 'test_reports':
        sub = realtimeManager.subscribeToTestReports(callback, filters);
        break;
      case 'payments':
        sub = realtimeManager.subscribeToPayments(callback, filters?.customerId);
        break;
      default:
        console.warn(`No realtime subscription available for table: ${table}`);
        return;
    }

    setSubscription(sub);

    return () => {
      if (sub) {
        sub.unsubscribe();
      }
    };
  }, [table, JSON.stringify(filters)]);

  return subscription;
}

// React hook for connection status
export function useRealtimeStatus() {
  const [status, setStatus] = React.useState(realtimeManager.getConnectionStatus());

  React.useEffect(() => {
    const unsubscribe = realtimeManager.onStatusChange(setStatus);
    return unsubscribe;
  }, []);

  return status;
}

export default realtimeManager;