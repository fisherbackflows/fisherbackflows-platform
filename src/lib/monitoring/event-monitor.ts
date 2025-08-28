import { applicationMonitor, recordMetric, measureOperation } from './application-monitor';
import { handleError, ErrorCategory, ErrorSeverity } from '../error-handling/error-manager';
import { logger } from '../logger';
import { cache } from '../cache';

export enum EventType {
  // Authentication events
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_REGISTRATION = 'user.registration',
  AUTH_FAILURE = 'auth.failure',
  PASSWORD_RESET = 'auth.password_reset',
  
  // Business events
  APPOINTMENT_CREATED = 'appointment.created',
  APPOINTMENT_UPDATED = 'appointment.updated',
  APPOINTMENT_CANCELLED = 'appointment.cancelled',
  APPOINTMENT_COMPLETED = 'appointment.completed',
  
  TEST_REPORT_CREATED = 'test_report.created',
  TEST_REPORT_SUBMITTED = 'test_report.submitted',
  TEST_REPORT_APPROVED = 'test_report.approved',
  
  INVOICE_CREATED = 'invoice.created',
  INVOICE_SENT = 'invoice.sent',
  INVOICE_PAID = 'invoice.paid',
  INVOICE_OVERDUE = 'invoice.overdue',
  
  PAYMENT_PROCESSED = 'payment.processed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',
  
  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_UPDATED = 'customer.updated',
  
  // Technical events
  DATABASE_QUERY = 'database.query',
  EXTERNAL_API_CALL = 'external_api.call',
  FILE_UPLOADED = 'file.uploaded',
  EMAIL_SENT = 'email.sent',
  SMS_SENT = 'sms.sent',
  
  // Security events
  SECURITY_SCAN_FAILED = 'security.scan_failed',
  UNAUTHORIZED_ACCESS = 'security.unauthorized_access',
  SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'security.rate_limit_exceeded',
  
  // Performance events
  SLOW_QUERY = 'performance.slow_query',
  HIGH_MEMORY_USAGE = 'performance.high_memory',
  HIGH_CPU_USAGE = 'performance.high_cpu',
  CACHE_MISS = 'performance.cache_miss'
}

export interface ApplicationEvent {
  id: string;
  type: EventType;
  timestamp: Date;
  userId?: string;
  organizationId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  metadata: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration?: number;
  success: boolean;
  error?: string;
}

export interface EventFilter {
  types?: EventType[];
  userId?: string;
  organizationId?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  severity?: ('low' | 'medium' | 'high' | 'critical')[];
  success?: boolean;
  limit?: number;
  offset?: number;
}

class EventMonitor {
  private eventHandlers = new Map<EventType, Array<(event: ApplicationEvent) => Promise<void>>>();
  private eventBuffer: ApplicationEvent[] = [];
  private bufferSize = 1000;
  private alertThresholds = new Map<EventType, {
    count: number;
    timeWindowMinutes: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>();

  constructor() {
    this.initializeDefaultAlerts();
    this.startEventProcessing();
    this.startMetricsCollection();
  }

  async trackEvent(
    type: EventType,
    metadata: Record<string, any> = {},
    context?: {
      userId?: string;
      organizationId?: string;
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
      duration?: number;
      success?: boolean;
      error?: string;
    }
  ): Promise<void> {
    const event: ApplicationEvent = {
      id: this.generateEventId(),
      type,
      timestamp: new Date(),
      ...context,
      metadata,
      severity: this.determineSeverity(type, context?.success !== false),
      success: context?.success !== false
    };

    try {
      // Add to buffer
      this.eventBuffer.push(event);
      
      // Maintain buffer size
      if (this.eventBuffer.length > this.bufferSize) {
        this.eventBuffer.shift();
      }

      // Store in cache for persistence
      await this.storeEvent(event);

      // Update metrics
      await this.updateEventMetrics(event);

      // Execute event handlers
      await this.executeEventHandlers(event);

      // Check alert thresholds
      await this.checkAlertThresholds(event);

      // Log significant events
      if (this.isSignificantEvent(event)) {
        await logger.info('Significant event tracked', {
          eventType: event.type,
          eventId: event.id,
          userId: event.userId,
          severity: event.severity,
          success: event.success,
          metadata: event.metadata
        });
      }

    } catch (error: any) {
      await handleError(error, {
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.MEDIUM,
        context: {
          eventType: type,
          eventMetadata: metadata
        }
      });
    }
  }

  registerEventHandler(
    type: EventType,
    handler: (event: ApplicationEvent) => Promise<void>
  ): void {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, []);
    }
    this.eventHandlers.get(type)!.push(handler);
  }

  async getEvents(filter: EventFilter = {}): Promise<{
    events: ApplicationEvent[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      let filteredEvents = [...this.eventBuffer];

      // Apply filters
      if (filter.types && filter.types.length > 0) {
        filteredEvents = filteredEvents.filter(e => filter.types!.includes(e.type));
      }

      if (filter.userId) {
        filteredEvents = filteredEvents.filter(e => e.userId === filter.userId);
      }

      if (filter.organizationId) {
        filteredEvents = filteredEvents.filter(e => e.organizationId === filter.organizationId);
      }

      if (filter.timeRange) {
        filteredEvents = filteredEvents.filter(e => 
          e.timestamp >= filter.timeRange!.start && 
          e.timestamp <= filter.timeRange!.end
        );
      }

      if (filter.severity && filter.severity.length > 0) {
        filteredEvents = filteredEvents.filter(e => filter.severity!.includes(e.severity));
      }

      if (filter.success !== undefined) {
        filteredEvents = filteredEvents.filter(e => e.success === filter.success);
      }

      // Sort by timestamp (newest first)
      filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      const total = filteredEvents.length;
      const offset = filter.offset || 0;
      const limit = filter.limit || 50;

      const events = filteredEvents.slice(offset, offset + limit);
      const hasMore = offset + limit < total;

      return { events, total, hasMore };

    } catch (error: any) {
      await handleError(error, {
        category: ErrorCategory.SYSTEM,
        context: { filter }
      });

      return { events: [], total: 0, hasMore: false };
    }
  }

  async getEventStats(timeRange: { start: Date; end: Date }): Promise<{
    totalEvents: number;
    eventsByType: Record<EventType, number>;
    eventsBySeverity: Record<string, number>;
    successRate: number;
    averageResponseTime: number;
    topErrors: Array<{ error: string; count: number }>;
  }> {
    const { events } = await this.getEvents({ timeRange, limit: 10000 });

    const stats = {
      totalEvents: events.length,
      eventsByType: {} as Record<EventType, number>,
      eventsBySeverity: {} as Record<string, number>,
      successRate: 0,
      averageResponseTime: 0,
      topErrors: [] as Array<{ error: string; count: number }>
    };

    if (events.length === 0) {
      return stats;
    }

    // Count by type
    for (const event of events) {
      stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;
      stats.eventsBySeverity[event.severity] = (stats.eventsBySeverity[event.severity] || 0) + 1;
    }

    // Calculate success rate
    const successfulEvents = events.filter(e => e.success).length;
    stats.successRate = (successfulEvents / events.length) * 100;

    // Calculate average response time
    const eventsWithDuration = events.filter(e => e.duration !== undefined);
    if (eventsWithDuration.length > 0) {
      const totalDuration = eventsWithDuration.reduce((sum, e) => sum + (e.duration || 0), 0);
      stats.averageResponseTime = totalDuration / eventsWithDuration.length;
    }

    // Top errors
    const errorCounts = new Map<string, number>();
    events.filter(e => e.error).forEach(e => {
      const error = e.error!;
      errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
    });

    stats.topErrors = Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }

  private async storeEvent(event: ApplicationEvent): Promise<void> {
    // Store in cache with TTL
    const key = `event:${event.id}`;
    await cache.set(key, event, 24 * 60 * 60); // 24 hours

    // Store in time-based index for efficient querying
    const timeKey = `events:${event.timestamp.toISOString().substring(0, 13)}`; // Hour-based
    const existingEvents = await cache.get(timeKey) || [];
    existingEvents.push(event.id);
    await cache.set(timeKey, existingEvents, 25 * 60 * 60); // 25 hours
  }

  private async updateEventMetrics(event: ApplicationEvent): Promise<void> {
    // Record general metrics
    await recordMetric({
      name: 'application_event',
      value: 1,
      unit: 'count',
      timestamp: event.timestamp,
      labels: {
        type: event.type,
        severity: event.severity,
        success: event.success.toString(),
        organization: event.organizationId || 'unknown'
      }
    });

    // Record duration metrics if available
    if (event.duration !== undefined) {
      await recordMetric({
        name: 'event_duration',
        value: event.duration,
        unit: 'ms',
        timestamp: event.timestamp,
        labels: {
          type: event.type,
          success: event.success.toString()
        }
      });
    }

    // Record user activity metrics
    if (event.userId) {
      await recordMetric({
        name: 'user_activity',
        value: 1,
        unit: 'count',
        timestamp: event.timestamp,
        labels: {
          userId: event.userId,
          eventType: event.type
        }
      });
    }
  }

  private async executeEventHandlers(event: ApplicationEvent): Promise<void> {
    const handlers = this.eventHandlers.get(event.type) || [];
    
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error: any) {
        await handleError(error, {
          category: ErrorCategory.SYSTEM,
          severity: ErrorSeverity.MEDIUM,
          context: {
            eventId: event.id,
            eventType: event.type,
            handlerError: error.message
          }
        });
      }
    }
  }

  private async checkAlertThresholds(event: ApplicationEvent): Promise<void> {
    const threshold = this.alertThresholds.get(event.type);
    if (!threshold) return;

    // Count similar events in the time window
    const windowStart = new Date(Date.now() - threshold.timeWindowMinutes * 60 * 1000);
    const recentEvents = this.eventBuffer.filter(e => 
      e.type === event.type && 
      e.timestamp >= windowStart
    );

    if (recentEvents.length >= threshold.count) {
      await this.triggerAlert(event.type, recentEvents.length, threshold);
    }
  }

  private async triggerAlert(
    eventType: EventType, 
    count: number, 
    threshold: { count: number; timeWindowMinutes: number; severity: string }
  ): Promise<void> {
    const alertKey = `alert:${eventType}:${Math.floor(Date.now() / (threshold.timeWindowMinutes * 60 * 1000))}`;
    
    // Check if we've already alerted for this time window
    const alreadyAlerted = await cache.get(alertKey);
    if (alreadyAlerted) return;

    // Mark as alerted
    await cache.set(alertKey, true, threshold.timeWindowMinutes * 60);

    // Send alert
    await logger.error('Alert threshold exceeded', {
      eventType,
      count,
      threshold: threshold.count,
      timeWindow: `${threshold.timeWindowMinutes} minutes`,
      severity: threshold.severity
    });

    // In production, send to external alerting systems
    // await this.sendExternalAlert(eventType, count, threshold);
  }

  private initializeDefaultAlerts(): void {
    // Authentication failures
    this.alertThresholds.set(EventType.AUTH_FAILURE, {
      count: 10,
      timeWindowMinutes: 5,
      severity: 'high'
    });

    // Payment failures
    this.alertThresholds.set(EventType.PAYMENT_FAILED, {
      count: 5,
      timeWindowMinutes: 10,
      severity: 'high'
    });

    // Unauthorized access attempts
    this.alertThresholds.set(EventType.UNAUTHORIZED_ACCESS, {
      count: 5,
      timeWindowMinutes: 5,
      severity: 'critical'
    });

    // Slow queries
    this.alertThresholds.set(EventType.SLOW_QUERY, {
      count: 10,
      timeWindowMinutes: 5,
      severity: 'medium'
    });

    // File upload security failures
    this.alertThresholds.set(EventType.SECURITY_SCAN_FAILED, {
      count: 3,
      timeWindowMinutes: 10,
      severity: 'high'
    });
  }

  private startEventProcessing(): void {
    // Process event buffer periodically
    setInterval(async () => {
      try {
        await this.processEventBuffer();
      } catch (error: any) {
        await logger.error('Event processing failed', { error: error.message });
      }
    }, 30000); // Every 30 seconds
  }

  private startMetricsCollection(): void {
    // Collect system metrics periodically
    setInterval(async () => {
      try {
        await this.collectSystemMetrics();
      } catch (error: any) {
        await logger.error('System metrics collection failed', { error: error.message });
      }
    }, 60000); // Every minute
  }

  private async processEventBuffer(): Promise<void> {
    // In production, batch write events to permanent storage
    const eventsToProcess = this.eventBuffer.filter(e => 
      Date.now() - e.timestamp.getTime() > 30000 // Events older than 30 seconds
    );

    if (eventsToProcess.length === 0) return;

    // Batch process events
    await logger.debug('Processing event buffer', {
      eventCount: eventsToProcess.length
    });

    // Remove processed events from buffer
    this.eventBuffer = this.eventBuffer.filter(e =>
      !eventsToProcess.some(processed => processed.id === e.id)
    );
  }

  private async collectSystemMetrics(): Promise<void> {
    // Memory usage
    const memoryUsage = process.memoryUsage();
    await recordMetric({
      name: 'memory_usage',
      value: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      unit: 'percentage',
      timestamp: new Date()
    });

    // Event buffer size
    await recordMetric({
      name: 'event_buffer_size',
      value: this.eventBuffer.length,
      unit: 'count',
      timestamp: new Date()
    });

    // Active sessions (simplified)
    const activeSessionsCount = await this.getActiveSessionsCount();
    await recordMetric({
      name: 'active_sessions',
      value: activeSessionsCount,
      unit: 'count',
      timestamp: new Date()
    });
  }

  private async getActiveSessionsCount(): Promise<number> {
    // In production, query active sessions from database/cache
    return 0; // Placeholder
  }

  private determineSeverity(
    eventType: EventType, 
    success: boolean
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (!success) {
      // Failed events are more severe
      switch (eventType) {
        case EventType.AUTH_FAILURE:
        case EventType.UNAUTHORIZED_ACCESS:
        case EventType.SECURITY_SCAN_FAILED:
          return 'critical';
        case EventType.PAYMENT_FAILED:
        case EventType.EMAIL_SENT:
          return 'high';
        default:
          return 'medium';
      }
    }

    // Successful events by type
    switch (eventType) {
      case EventType.USER_LOGIN:
      case EventType.PAYMENT_PROCESSED:
      case EventType.TEST_REPORT_SUBMITTED:
        return 'low';
      case EventType.INVOICE_OVERDUE:
      case EventType.SLOW_QUERY:
        return 'medium';
      case EventType.SUSPICIOUS_ACTIVITY:
        return 'high';
      default:
        return 'low';
    }
  }

  private isSignificantEvent(event: ApplicationEvent): boolean {
    // Log high and critical severity events
    if (event.severity === 'high' || event.severity === 'critical') {
      return true;
    }

    // Log failed events
    if (!event.success) {
      return true;
    }

    // Log specific business events
    const significantTypes = [
      EventType.USER_REGISTRATION,
      EventType.APPOINTMENT_COMPLETED,
      EventType.INVOICE_PAID,
      EventType.TEST_REPORT_APPROVED
    ];

    return significantTypes.includes(event.type);
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const eventMonitor = new EventMonitor();

// Convenience functions
export const trackEvent = (
  type: EventType,
  metadata?: Record<string, any>,
  context?: Parameters<EventMonitor['trackEvent']>[2]
): Promise<void> => {
  return eventMonitor.trackEvent(type, metadata, context);
};

export const registerEventHandler = (
  type: EventType,
  handler: (event: ApplicationEvent) => Promise<void>
): void => {
  eventMonitor.registerEventHandler(type, handler);
};

export const getEvents = (filter?: EventFilter) => {
  return eventMonitor.getEvents(filter);
};

export const getEventStats = (timeRange: { start: Date; end: Date }) => {
  return eventMonitor.getEventStats(timeRange);
};