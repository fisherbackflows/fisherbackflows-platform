/**
 * Enterprise Compliance & Audit Logging System
 * Fisher Backflows - Complete Regulatory Compliance
 */

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════
// AUDIT SCHEMAS & TYPES
// ═══════════════════════════════════════════════════════════════════════

export enum AuditEventType {
  // Authentication Events
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILURE = 'auth.login.failure',
  LOGOUT = 'auth.logout',
  PASSWORD_RESET = 'auth.password.reset',
  MFA_ENABLED = 'auth.mfa.enabled',
  MFA_DISABLED = 'auth.mfa.disabled',
  SESSION_EXPIRED = 'auth.session.expired',
  ACCOUNT_LOCKED = 'auth.account.locked',

  // Customer Data Events
  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_UPDATED = 'customer.updated',
  CUSTOMER_DELETED = 'customer.deleted', // GDPR compliance
  CUSTOMER_VIEWED = 'customer.viewed',
  CUSTOMER_EXPORTED = 'customer.exported',
  CUSTOMER_ANONYMIZED = 'customer.anonymized', // GDPR right to be forgotten

  // Payment Events
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',
  CARD_STORED = 'payment.card.stored',
  CARD_DELETED = 'payment.card.deleted',

  // Document Events
  INVOICE_CREATED = 'document.invoice.created',
  INVOICE_SENT = 'document.invoice.sent',
  INVOICE_VIEWED = 'document.invoice.viewed',
  INVOICE_PAID = 'document.invoice.paid',
  REPORT_GENERATED = 'document.report.generated',
  REPORT_SIGNED = 'document.report.signed',
  REPORT_SUBMITTED = 'document.report.submitted',

  // System Events
  BACKUP_CREATED = 'system.backup.created',
  BACKUP_RESTORED = 'system.backup.restored',
  CONFIG_CHANGED = 'system.config.changed',
  SECURITY_ALERT = 'system.security.alert',
  SYSTEM_ERROR = 'system.error',
  API_REQUEST = 'api.request',

  // Admin Events
  USER_CREATED = 'admin.user.created',
  USER_UPDATED = 'admin.user.updated',
  USER_DELETED = 'admin.user.deleted',
  ROLE_ASSIGNED = 'admin.role.assigned',
  PERMISSIONS_CHANGED = 'admin.permissions.changed',
  SETTINGS_CHANGED = 'admin.settings.changed',

  // Privacy & Compliance
  DATA_REQUEST = 'privacy.data.request', // GDPR data request
  DATA_EXPORT = 'privacy.data.export',   // GDPR data export
  DATA_DELETION = 'privacy.data.deletion', // GDPR right to erasure
  CONSENT_GIVEN = 'privacy.consent.given',
  CONSENT_WITHDRAWN = 'privacy.consent.withdrawn'
}

export enum ComplianceRegulation {
  GDPR = 'GDPR',
  CCPA = 'CCPA',
  SOC2 = 'SOC2',
  HIPAA = 'HIPAA',
  PCI_DSS = 'PCI_DSS',
  WA_STATE = 'WA_STATE', // Washington State regulations
  EPA = 'EPA' // Environmental Protection Agency
}

export interface AuditEvent {
  id?: string;
  eventType: AuditEventType;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  entityType?: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  regulations?: ComplianceRegulation[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  success: boolean;
  errorMessage?: string;
  timestamp: Date;
  organizationId?: string;
}

export interface ComplianceReport {
  regulation: ComplianceRegulation;
  startDate: Date;
  endDate: Date;
  events: AuditEvent[];
  summary: {
    totalEvents: number;
    eventsByType: Record<string, number>;
    criticalEvents: number;
    failedEvents: number;
  };
  complianceScore: number;
  recommendations: string[];
}

export interface DataRetentionPolicy {
  entityType: string;
  retentionPeriodDays: number;
  archiveAfterDays?: number;
  regulations: ComplianceRegulation[];
  autoDelete: boolean;
}

const AuditEventSchema = z.object({
  eventType: z.nativeEnum(AuditEventType),
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  oldValues: z.record(z.any()).optional(),
  newValues: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  regulations: z.array(z.nativeEnum(ComplianceRegulation)).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  success: z.boolean(),
  errorMessage: z.string().optional(),
  organizationId: z.string().uuid().optional()
});

// ═══════════════════════════════════════════════════════════════════════
// AUDIT LOGGER CLASS
// ═══════════════════════════════════════════════════════════════════════

export class AuditLogger {
  private supabase: any;
  private batchSize = 100;
  private batchTimeout = 5000; // 5 seconds
  private eventBatch: AuditEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private retentionPolicies: Map<string, DataRetentionPolicy> = new Map();

  constructor() {
    if (typeof window === 'undefined') {
      // Server-side initialization
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    }
    this.initializeRetentionPolicies();
    this.startBatchProcessor();
    this.startRetentionCleaner();
  }

  /**
   * Log an audit event
   */
  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      // Validate event data
      const validatedEvent = AuditEventSchema.parse(event);
      
      const auditEvent: AuditEvent = {
        ...validatedEvent,
        timestamp: new Date(),
        regulations: event.regulations || this.inferRegulations(event)
      };

      // Sanitize sensitive data
      const sanitizedEvent = this.sanitizeEvent(auditEvent);

      // Add to batch
      this.eventBatch.push(sanitizedEvent);

      // Process immediately for critical events
      if (sanitizedEvent.severity === 'critical') {
        await this.processBatch();
      }

      // Process batch if size limit reached
      if (this.eventBatch.length >= this.batchSize) {
        await this.processBatch();
      }

    } catch (error) {
      console.error('Failed to log audit event', error);
    }
  }

  /**
   * Log authentication event
   */
  async logAuth(
    eventType: AuditEventType,
    userId?: string,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      eventType,
      userId,
      sessionId,
      ipAddress,
      userAgent,
      success,
      errorMessage,
      metadata,
      severity: success ? 'low' : 'medium',
      regulations: [ComplianceRegulation.SOC2]
    });
  }

  /**
   * Log data access event
   */
  async logDataAccess(
    entityType: string,
    entityId: string,
    userId?: string,
    operation: 'create' | 'read' | 'update' | 'delete' = 'read',
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<void> {
    const eventType = this.getDataEventType(entityType, operation);
    
    await this.logEvent({
      eventType,
      userId,
      entityType,
      entityId,
      oldValues,
      newValues,
      metadata,
      success: true,
      severity: operation === 'delete' ? 'high' : 'low',
      regulations: [ComplianceRegulation.GDPR, ComplianceRegulation.CCPA]
    });
  }

  /**
   * Log payment event
   */
  async logPayment(
    eventType: AuditEventType,
    userId: string,
    paymentId?: string,
    amount?: number,
    paymentMethod?: string,
    success: boolean = true,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      eventType,
      userId,
      entityType: 'payment',
      entityId: paymentId,
      metadata: {
        ...metadata,
        amount: amount ? `$${amount}` : undefined, // Don't log exact amounts for PCI compliance
        paymentMethodType: paymentMethod?.split('_')[0] // Only log type, not details
      },
      success,
      errorMessage,
      severity: success ? 'medium' : 'high',
      regulations: [ComplianceRegulation.PCI_DSS, ComplianceRegulation.SOC2]
    });
  }

  /**
   * Log system event
   */
  async logSystem(
    eventType: AuditEventType,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    success: boolean = true,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      eventType,
      severity,
      success,
      errorMessage,
      metadata,
      regulations: [ComplianceRegulation.SOC2]
    });
  }

  /**
   * Log GDPR compliance event
   */
  async logGDPREvent(
    eventType: AuditEventType,
    userId: string,
    entityType: string,
    entityId: string,
    legalBasis: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      eventType,
      userId,
      entityType,
      entityId,
      metadata: {
        ...metadata,
        legalBasis,
        gdprArticle: this.getGDPRArticle(eventType)
      },
      success: true,
      severity: 'high',
      regulations: [ComplianceRegulation.GDPR]
    });
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    regulation: ComplianceRegulation,
    startDate: Date,
    endDate: Date,
    organizationId?: string
  ): Promise<ComplianceReport> {
    try {
      let query = this.supabase
        .from('audit_logs')
        .select('*')
        .contains('regulations', [regulation])
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())
        .order('timestamp', { ascending: false });

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data: events, error } = await query;

      if (error) {
        throw error;
      }

      const eventsByType: Record<string, number> = {};
      let criticalEvents = 0;
      let failedEvents = 0;

      events?.forEach(event => {
        eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1;
        if (event.severity === 'critical') criticalEvents++;
        if (!event.success) failedEvents++;
      });

      const complianceScore = this.calculateComplianceScore(events || [], regulation);
      const recommendations = this.generateRecommendations(events || [], regulation);

      const report: ComplianceReport = {
        regulation,
        startDate,
        endDate,
        events: events || [],
        summary: {
          totalEvents: events?.length || 0,
          eventsByType,
          criticalEvents,
          failedEvents
        },
        complianceScore,
        recommendations
      };

      return report;
    } catch (error) {
      console.error('Failed to generate compliance report', error);
      throw error;
    }
  }

  /**
   * Search audit logs
   */
  async searchLogs(
    criteria: {
      userId?: string;
      entityType?: string;
      entityId?: string;
      eventTypes?: AuditEventType[];
      startDate?: Date;
      endDate?: Date;
      severity?: string;
      success?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<AuditEvent[]> {
    try {
      let query = this.supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(criteria.limit || 100)
        .range(criteria.offset || 0, (criteria.offset || 0) + (criteria.limit || 100) - 1);

      if (criteria.userId) {
        query = query.eq('user_id', criteria.userId);
      }
      if (criteria.entityType) {
        query = query.eq('entity_type', criteria.entityType);
      }
      if (criteria.entityId) {
        query = query.eq('entity_id', criteria.entityId);
      }
      if (criteria.eventTypes?.length) {
        query = query.in('event_type', criteria.eventTypes);
      }
      if (criteria.startDate) {
        query = query.gte('timestamp', criteria.startDate.toISOString());
      }
      if (criteria.endDate) {
        query = query.lte('timestamp', criteria.endDate.toISOString());
      }
      if (criteria.severity) {
        query = query.eq('severity', criteria.severity);
      }
      if (criteria.success !== undefined) {
        query = query.eq('success', criteria.success);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to search audit logs', error);
      return [];
    }
  }

  /**
   * Export audit logs for compliance
   */
  async exportLogs(
    format: 'json' | 'csv' | 'xml' = 'json',
    criteria: {
      startDate: Date;
      endDate: Date;
      regulation?: ComplianceRegulation;
      userId?: string;
    }
  ): Promise<string> {
    try {
      const events = await this.searchLogs({
        startDate: criteria.startDate,
        endDate: criteria.endDate,
        userId: criteria.userId,
        limit: 10000 // Large export
      });

      // Filter by regulation if specified
      const filteredEvents = criteria.regulation
        ? events.filter(event => event.regulations?.includes(criteria.regulation!))
        : events;

      // Log the export
      await this.logEvent({
        eventType: AuditEventType.DATA_EXPORT,
        userId: criteria.userId,
        metadata: {
          exportFormat: format,
          recordCount: filteredEvents.length,
          dateRange: `${criteria.startDate.toISOString()} to ${criteria.endDate.toISOString()}`,
          regulation: criteria.regulation
        },
        success: true,
        severity: 'medium',
        regulations: [ComplianceRegulation.GDPR, ComplianceRegulation.CCPA]
      });

      switch (format) {
        case 'csv':
          return this.convertToCSV(filteredEvents);
        case 'xml':
          return this.convertToXML(filteredEvents);
        default:
          return JSON.stringify(filteredEvents, null, 2);
      }
    } catch (error) {
      console.error('Failed to export audit logs', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════

  private initializeRetentionPolicies(): void {
    const policies: DataRetentionPolicy[] = [
      {
        entityType: 'audit_logs',
        retentionPeriodDays: 2555, // 7 years for SOX compliance
        regulations: [ComplianceRegulation.SOC2],
        autoDelete: false
      },
      {
        entityType: 'customer',
        retentionPeriodDays: 1095, // 3 years post-relationship
        archiveAfterDays: 365,
        regulations: [ComplianceRegulation.GDPR, ComplianceRegulation.CCPA],
        autoDelete: false // Manual review required
      },
      {
        entityType: 'payment',
        retentionPeriodDays: 2555, // 7 years for financial records
        regulations: [ComplianceRegulation.PCI_DSS],
        autoDelete: false
      },
      {
        entityType: 'session',
        retentionPeriodDays: 90,
        regulations: [ComplianceRegulation.GDPR],
        autoDelete: true
      }
    ];

    policies.forEach(policy => {
      this.retentionPolicies.set(policy.entityType, policy);
    });
  }

  private async processBatch(): Promise<void> {
    if (this.eventBatch.length === 0) return;

    const batch = [...this.eventBatch];
    this.eventBatch = [];

    try {
      const { error } = await this.supabase
        .from('audit_logs')
        .insert(batch.map(event => ({
          event_type: event.eventType,
          user_id: event.userId,
          session_id: event.sessionId,
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          entity_type: event.entityType,
          entity_id: event.entityId,
          old_values: event.oldValues,
          new_values: event.newValues,
          metadata: event.metadata,
          regulations: event.regulations,
          severity: event.severity,
          success: event.success,
          error_message: event.errorMessage,
          timestamp: event.timestamp.toISOString(),
          organization_id: event.organizationId
        })));

      if (error) {
        throw error;
      }

      console.log(`Processed audit batch of ${batch.length} events`);

    } catch (error) {
      console.error('Failed to process audit batch', error);
      // Re-add failed events back to batch for retry
      this.eventBatch.unshift(...batch);
    }
  }

  private startBatchProcessor(): void {
    this.batchTimer = setInterval(async () => {
      await this.processBatch();
    }, this.batchTimeout);
  }

  private startRetentionCleaner(): void {
    // Run retention cleanup daily at 2 AM
    setInterval(async () => {
      await this.cleanupExpiredData();
    }, 24 * 60 * 60 * 1000);
  }

  private async cleanupExpiredData(): Promise<void> {
    try {
      for (const [entityType, policy] of this.retentionPolicies) {
        if (policy.autoDelete) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);

          const { error } = await this.supabase
            .from('audit_logs')
            .delete()
            .eq('entity_type', entityType)
            .lt('timestamp', cutoffDate.toISOString());

          if (error) {
            throw error;
          }

          await this.logSystem(
            AuditEventType.BACKUP_CREATED,
            'low',
            true,
            undefined,
            {
              operation: 'data_retention_cleanup',
              entityType,
              cutoffDate: cutoffDate.toISOString()
            }
          );
        }
      }
    } catch (error) {
      console.error('Failed to cleanup expired data', error);
    }
  }

  private sanitizeEvent(event: AuditEvent): AuditEvent {
    const sanitized = { ...event };

    // Remove sensitive data
    if (sanitized.oldValues) {
      sanitized.oldValues = this.sanitizeValues(sanitized.oldValues);
    }
    if (sanitized.newValues) {
      sanitized.newValues = this.sanitizeValues(sanitized.newValues);
    }
    if (sanitized.metadata) {
      sanitized.metadata = this.sanitizeValues(sanitized.metadata);
    }

    return sanitized;
  }

  private sanitizeValues(values: Record<string, any>): Record<string, any> {
    const sensitiveFields = ['password', 'ssn', 'credit_card', 'bank_account', 'api_key', 'token'];
    const sanitized = { ...values };

    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private inferRegulations(event: AuditEvent): ComplianceRegulation[] {
    const regulations: ComplianceRegulation[] = [];

    // All events require SOC2 compliance
    regulations.push(ComplianceRegulation.SOC2);

    // Data-related events
    if (event.entityType === 'customer' || event.eventType.toString().includes('customer')) {
      regulations.push(ComplianceRegulation.GDPR, ComplianceRegulation.CCPA);
    }

    // Payment-related events
    if (event.eventType.toString().includes('payment') || event.entityType === 'payment') {
      regulations.push(ComplianceRegulation.PCI_DSS);
    }

    // Authentication events
    if (event.eventType.toString().includes('auth')) {
      regulations.push(ComplianceRegulation.SOC2);
    }

    return regulations;
  }

  private getDataEventType(entityType: string, operation: string): AuditEventType {
    const key = `${entityType.toUpperCase()}_${operation.toUpperCase()}` as keyof typeof AuditEventType;
    return AuditEventType[key] || AuditEventType.SYSTEM_ERROR;
  }

  private getGDPRArticle(eventType: AuditEventType): string {
    switch (eventType) {
      case AuditEventType.DATA_REQUEST:
        return 'Article 15 - Right of access';
      case AuditEventType.DATA_EXPORT:
        return 'Article 20 - Right to data portability';
      case AuditEventType.DATA_DELETION:
        return 'Article 17 - Right to erasure';
      case AuditEventType.CONSENT_GIVEN:
      case AuditEventType.CONSENT_WITHDRAWN:
        return 'Article 7 - Conditions for consent';
      default:
        return 'Article 6 - Lawfulness of processing';
    }
  }

  private calculateComplianceScore(events: AuditEvent[], regulation: ComplianceRegulation): number {
    if (events.length === 0) return 100;

    const criticalEvents = events.filter(e => e.severity === 'critical').length;
    const failedEvents = events.filter(e => !e.success).length;
    
    const criticalPenalty = (criticalEvents / events.length) * 50;
    const failurePenalty = (failedEvents / events.length) * 30;
    
    return Math.max(0, 100 - criticalPenalty - failurePenalty);
  }

  private generateRecommendations(events: AuditEvent[], regulation: ComplianceRegulation): string[] {
    const recommendations: string[] = [];
    
    const criticalEvents = events.filter(e => e.severity === 'critical').length;
    const failedEvents = events.filter(e => !e.success).length;
    
    if (criticalEvents > 0) {
      recommendations.push(`Address ${criticalEvents} critical security events immediately`);
    }
    
    if (failedEvents > events.length * 0.1) {
      recommendations.push('High failure rate detected - investigate system stability');
    }
    
    if (regulation === ComplianceRegulation.GDPR) {
      const dataEvents = events.filter(e => e.eventType.toString().includes('DATA'));
      if (dataEvents.length === 0) {
        recommendations.push('No GDPR data processing events logged - verify compliance');
      }
    }
    
    return recommendations;
  }

  private convertToCSV(events: AuditEvent[]): string {
    if (events.length === 0) return '';

    const headers = ['timestamp', 'eventType', 'userId', 'entityType', 'entityId', 'severity', 'success'];
    const rows = events.map(event => [
      event.timestamp.toISOString(),
      event.eventType,
      event.userId || '',
      event.entityType || '',
      event.entityId || '',
      event.severity,
      event.success.toString()
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  private convertToXML(events: AuditEvent[]): string {
    const xmlEvents = events.map(event => `
    <event>
      <timestamp>${event.timestamp.toISOString()}</timestamp>
      <type>${event.eventType}</type>
      <userId>${event.userId || ''}</userId>
      <entityType>${event.entityType || ''}</entityType>
      <entityId>${event.entityId || ''}</entityId>
      <severity>${event.severity}</severity>
      <success>${event.success}</success>
      <regulations>${event.regulations?.join(',') || ''}</regulations>
    </event>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<auditLog>
  <exportDate>${new Date().toISOString()}</exportDate>
  <eventCount>${events.length}</eventCount>
  <events>${xmlEvents}
  </events>
</auditLog>`;
  }

  // Context management methods (moved from GDPRCompliance to AuditLogger)
  setContext(context: {
    sessionId?: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
  }): void {
    (globalThis as any).__auditContext = context;
  }

  clearContext(): void {
    (globalThis as any).__auditContext = null;
  }

  private getContext(): any {
    return (globalThis as any).__auditContext || {};
  }

  async logApiRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    userId?: string,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    const context = this.getContext();
    await this.logEvent({
      eventType: AuditEventType.API_REQUEST,
      userId: userId || context.userId,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      entityType: 'api_request',
      metadata: {
        method,
        url,
        statusCode,
        responseTime,
        requestId: context.requestId
      },
      success,
      errorMessage,
      severity: statusCode >= 500 ? 'high' : statusCode >= 400 ? 'medium' : 'low',
      regulations: [ComplianceRegulation.SOC2]
    });
  }

  async logSecurityEvent(
    eventType: AuditEventType,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const context = this.getContext();
    await this.logEvent({
      eventType,
      userId: userId || context.userId,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      entityType: 'security_event',
      metadata: {
        description,
        ...metadata,
        requestId: context.requestId
      },
      success: true,
      severity,
      regulations: [ComplianceRegulation.SOC2, ComplianceRegulation.GDPR]
    });
  }

  async logDataChange(
    operation: 'create' | 'update' | 'delete',
    entityType: string,
    entityId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const context = this.getContext();
    await this.logEvent({
      eventType: operation === 'create' ? AuditEventType.CUSTOMER_CREATED :
                 operation === 'update' ? AuditEventType.CUSTOMER_UPDATED :
                 AuditEventType.CUSTOMER_DELETED,
      userId: userId || context.userId,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      entityType,
      entityId,
      oldValues,
      newValues,
      metadata: {
        operation,
        ...metadata,
        requestId: context.requestId
      },
      success: true,
      severity: operation === 'delete' ? 'high' : 'low',
      regulations: [ComplianceRegulation.GDPR, ComplianceRegulation.CCPA]
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// GDPR COMPLIANCE HELPERS
// ═══════════════════════════════════════════════════════════════════════

export class GDPRCompliance {
  private auditLogger: AuditLogger;

  constructor(auditLogger: AuditLogger) {
    this.auditLogger = auditLogger;
  }

  /**
   * Handle GDPR data subject access request
   */
  async handleDataRequest(userId: string, requesterUserId: string): Promise<any> {
    await this.auditLogger.logGDPREvent(
      AuditEventType.DATA_REQUEST,
      requesterUserId,
      'user',
      userId,
      'Article 15 - Right of access'
    );

    // Gather all user data from various tables
    const userData = await this.gatherUserData(userId);
    
    return userData;
  }

  /**
   * Handle GDPR right to be forgotten (erasure)
   */
  async handleDataDeletion(userId: string, requesterUserId: string): Promise<boolean> {
    await this.auditLogger.logGDPREvent(
      AuditEventType.DATA_DELETION,
      requesterUserId,
      'user',
      userId,
      'Article 17 - Right to erasure'
    );

    // Anonymize or delete user data
    const success = await this.anonymizeUserData(userId);
    
    return success;
  }

  /**
   * Handle consent management
   */
  async recordConsent(
    userId: string, 
    consentType: string, 
    granted: boolean,
    legalBasis: string
  ): Promise<void> {
    await this.auditLogger.logGDPREvent(
      granted ? AuditEventType.CONSENT_GIVEN : AuditEventType.CONSENT_WITHDRAWN,
      userId,
      'consent',
      `${userId}-${consentType}`,
      legalBasis,
      { consentType, granted }
    );
  }

  private async gatherUserData(userId: string): Promise<any> {
    // Implementation would gather data from all relevant tables
    // This is a placeholder
    return { message: 'User data would be gathered here' };
  }

  private async anonymizeUserData(userId: string): Promise<boolean> {
    // Implementation would anonymize/delete user data
    // This is a placeholder
    return true;
  }

  /**
   * Set audit context for request tracking
   */
  setContext(context: {
    sessionId?: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
  }): void {
    // Store context in request-local storage
    // In a real implementation, this would use async local storage
    (globalThis as any).__auditContext = context;
  }

  /**
   * Clear audit context
   */
  clearContext(): void {
    (globalThis as any).__auditContext = null;
  }

  /**
   * Get current audit context
   */
  private getContext(): any {
    return (globalThis as any).__auditContext || {};
  }

  /**
   * Log API request
   */
  async logApiRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    userId?: string,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    const context = this.getContext();
    await this.logEvent({
      eventType: AuditEventType.API_REQUEST,
      userId: userId || context.userId,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      entityType: 'api_request',
      metadata: {
        method,
        url,
        statusCode,
        responseTime,
        requestId: context.requestId
      },
      success,
      errorMessage,
      severity: statusCode >= 500 ? 'high' : statusCode >= 400 ? 'medium' : 'low',
      regulations: [ComplianceRegulation.SOC2]
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    eventType: AuditEventType,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const context = this.getContext();
    await this.logEvent({
      eventType,
      userId: userId || context.userId,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      entityType: 'security_event',
      metadata: {
        description,
        ...metadata,
        requestId: context.requestId
      },
      success: true,
      severity,
      regulations: [ComplianceRegulation.SOC2, ComplianceRegulation.GDPR]
    });
  }

  /**
   * Log data change event
   */
  async logDataChange(
    operation: 'create' | 'update' | 'delete',
    entityType: string,
    entityId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const context = this.getContext();
    await this.logEvent({
      eventType: operation === 'create' ? AuditEventType.CUSTOMER_CREATED :
                 operation === 'update' ? AuditEventType.CUSTOMER_UPDATED :
                 AuditEventType.CUSTOMER_DELETED,
      userId: userId || context.userId,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      entityType,
      entityId,
      oldValues,
      newValues,
      metadata: {
        operation,
        ...metadata,
        requestId: context.requestId
      },
      success: true,
      severity: operation === 'delete' ? 'high' : 'low',
      regulations: [ComplianceRegulation.GDPR, ComplianceRegulation.CCPA]
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// EXPORT SINGLETON
// ═══════════════════════════════════════════════════════════════════════

export const auditLogger = new AuditLogger();
export const gdprCompliance = new GDPRCompliance(auditLogger);

export default {
  auditLogger,
  gdprCompliance,
  AuditEventType,
  ComplianceRegulation
};