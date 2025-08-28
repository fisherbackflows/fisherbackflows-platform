import { NextRequest, NextResponse } from 'next/server';
import { trackEvent, EventType } from './event-monitor';
import { measureOperation, recordMetric } from './application-monitor';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth';

export interface MonitoringOptions {
  trackPerformance?: boolean;
  trackBusinessEvents?: boolean;
  trackSecurityEvents?: boolean;
  eventType?: EventType;
  resourceType?: string;
  actionType?: string;
  sensitiveFields?: string[];
}

export function withMonitoring<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse | Response>,
  options: MonitoringOptions = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now();
    let response: NextResponse | Response;
    let success = true;
    let error: string | undefined;
    let statusCode = 200;
    
    // Extract request metadata
    const requestMetadata = await extractRequestMetadata(request);
    const session = await getServerSession(authOptions);
    
    // Track request start
    if (options.trackPerformance !== false) {
      await recordMetric({
        name: 'api_request',
        value: 1,
        unit: 'count',
        timestamp: new Date(),
        labels: {
          endpoint: requestMetadata.endpoint,
          method: request.method,
          organization: session?.user?.organizationId || 'unknown'
        }
      });
    }

    try {
      // Execute the handler with performance monitoring
      response = await measureOperation(
        `${request.method}_${requestMetadata.endpoint}`,
        async () => await handler(request, context),
        {
          endpoint: requestMetadata.endpoint,
          method: request.method,
          userId: session?.user?.id
        }
      );

      // Convert Response to NextResponse if needed
      if (response instanceof Response && !(response instanceof NextResponse)) {
        const body = await response.text();
        response = NextResponse.json(
          body ? JSON.parse(body) : null,
          { status: response.status }
        );
      }

      statusCode = response.status;
      success = statusCode < 400;

    } catch (handlerError: any) {
      success = false;
      error = handlerError.message;
      statusCode = 500;
      
      // Create error response
      response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );

      // Track security events for certain errors
      if (options.trackSecurityEvents !== false) {
        await trackSecurityEvent(handlerError, requestMetadata, session?.user?.id);
      }
    }

    const duration = Date.now() - startTime;

    // Track performance metrics
    if (options.trackPerformance !== false) {
      await recordMetric({
        name: 'api_response_time',
        value: duration,
        unit: 'ms',
        timestamp: new Date(),
        labels: {
          endpoint: requestMetadata.endpoint,
          method: request.method,
          status: statusCode.toString(),
          success: success.toString()
        }
      });

      await recordMetric({
        name: 'api_response',
        value: 1,
        unit: 'count',
        timestamp: new Date(),
        labels: {
          endpoint: requestMetadata.endpoint,
          method: request.method,
          status: statusCode.toString()
        }
      });
    }

    // Track business events
    if (options.trackBusinessEvents !== false && options.eventType) {
      await trackBusinessEvent(
        options.eventType,
        requestMetadata,
        session?.user,
        success,
        error,
        duration
      );
    }

    // Track general API event
    await trackEvent(EventType.EXTERNAL_API_CALL, {
      endpoint: requestMetadata.endpoint,
      method: request.method,
      statusCode,
      responseSize: getResponseSize(response),
      requestSize: requestMetadata.contentLength,
      userAgent: requestMetadata.userAgent,
      referer: requestMetadata.referer
    }, {
      userId: session?.user?.id,
      organizationId: session?.user?.organizationId,
      sessionId: requestMetadata.sessionId,
      ipAddress: requestMetadata.ipAddress,
      userAgent: requestMetadata.userAgent,
      duration,
      success,
      error
    });

    // Add monitoring headers to response
    const finalResponse = response as NextResponse;
    finalResponse.headers.set('X-Response-Time', `${duration}ms`);
    finalResponse.headers.set('X-Request-ID', requestMetadata.requestId);
    
    return finalResponse;
  };
}

async function extractRequestMetadata(request: NextRequest) {
  const url = new URL(request.url);
  const requestId = generateRequestId();
  
  return {
    requestId,
    endpoint: url.pathname,
    method: request.method,
    ipAddress: getClientIP(request),
    userAgent: request.headers.get('user-agent') || 'unknown',
    referer: request.headers.get('referer'),
    contentLength: parseInt(request.headers.get('content-length') || '0'),
    contentType: request.headers.get('content-type'),
    sessionId: extractSessionId(request),
    query: Object.fromEntries(url.searchParams.entries()),
    timestamp: new Date()
  };
}

async function trackBusinessEvent(
  eventType: EventType,
  requestMetadata: any,
  user: any,
  success: boolean,
  error?: string,
  duration?: number
) {
  const businessMetadata: Record<string, any> = {
    endpoint: requestMetadata.endpoint,
    method: requestMetadata.method,
    query: requestMetadata.query
  };

  // Add specific business context based on event type
  switch (eventType) {
    case EventType.APPOINTMENT_CREATED:
    case EventType.APPOINTMENT_UPDATED:
      businessMetadata.resource = 'appointment';
      businessMetadata.action = requestMetadata.method.toLowerCase();
      break;
      
    case EventType.TEST_REPORT_CREATED:
    case EventType.TEST_REPORT_SUBMITTED:
      businessMetadata.resource = 'test_report';
      businessMetadata.action = getActionFromEndpoint(requestMetadata.endpoint);
      break;
      
    case EventType.INVOICE_CREATED:
    case EventType.PAYMENT_PROCESSED:
      businessMetadata.resource = 'payment';
      businessMetadata.action = getActionFromEndpoint(requestMetadata.endpoint);
      break;
      
    case EventType.FILE_UPLOADED:
      businessMetadata.resource = 'file';
      businessMetadata.action = 'upload';
      break;
  }

  await trackEvent(eventType, businessMetadata, {
    userId: user?.id,
    organizationId: user?.organizationId,
    sessionId: requestMetadata.sessionId,
    ipAddress: requestMetadata.ipAddress,
    userAgent: requestMetadata.userAgent,
    duration,
    success,
    error
  });
}

async function trackSecurityEvent(
  error: Error,
  requestMetadata: any,
  userId?: string
) {
  const errorMessage = error.message.toLowerCase();
  
  let securityEventType: EventType | null = null;
  
  if (errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
    securityEventType = EventType.UNAUTHORIZED_ACCESS;
  } else if (errorMessage.includes('rate limit')) {
    securityEventType = EventType.RATE_LIMIT_EXCEEDED;
  } else if (errorMessage.includes('suspicious') || errorMessage.includes('malicious')) {
    securityEventType = EventType.SUSPICIOUS_ACTIVITY;
  } else if (errorMessage.includes('virus') || errorMessage.includes('malware')) {
    securityEventType = EventType.SECURITY_SCAN_FAILED;
  }

  if (securityEventType) {
    await trackEvent(securityEventType, {
      endpoint: requestMetadata.endpoint,
      method: requestMetadata.method,
      errorMessage: error.message,
      userAgent: requestMetadata.userAgent
    }, {
      userId,
      sessionId: requestMetadata.sessionId,
      ipAddress: requestMetadata.ipAddress,
      userAgent: requestMetadata.userAgent,
      success: false,
      error: error.message
    });
  }
}

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return request.headers.get('x-real-ip') ||
         request.headers.get('x-client-ip') ||
         request.headers.get('cf-connecting-ip') ||
         request.ip ||
         'unknown';
}

function extractSessionId(request: NextRequest): string | undefined {
  // Try to extract session ID from various sources
  const sessionCookie = request.cookies.get('next-auth.session-token');
  if (sessionCookie) {
    return sessionCookie.value.substring(0, 20); // Truncate for privacy
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7, 27); // Truncate for privacy
  }

  return undefined;
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getActionFromEndpoint(endpoint: string): string {
  if (endpoint.includes('create') || endpoint.endsWith('POST')) return 'create';
  if (endpoint.includes('update') || endpoint.includes('PUT') || endpoint.includes('PATCH')) return 'update';
  if (endpoint.includes('delete') || endpoint.includes('DELETE')) return 'delete';
  if (endpoint.includes('get') || endpoint.includes('GET')) return 'read';
  return 'unknown';
}

function getResponseSize(response: NextResponse | Response): number {
  const contentLength = response.headers.get('content-length');
  return contentLength ? parseInt(contentLength) : 0;
}

// Specific monitoring wrappers for common business operations
export const withAppointmentMonitoring = (
  handler: (request: NextRequest, context?: any) => Promise<NextResponse | Response>
) => withMonitoring(handler, {
  trackBusinessEvents: true,
  eventType: EventType.APPOINTMENT_CREATED, // Will be adjusted based on method
  resourceType: 'appointment'
});

export const withPaymentMonitoring = (
  handler: (request: NextRequest, context?: any) => Promise<NextResponse | Response>
) => withMonitoring(handler, {
  trackBusinessEvents: true,
  eventType: EventType.PAYMENT_PROCESSED,
  resourceType: 'payment',
  sensitiveFields: ['payment_method', 'card_number', 'cvv']
});

export const withTestReportMonitoring = (
  handler: (request: NextRequest, context?: any) => Promise<NextResponse | Response>
) => withMonitoring(handler, {
  trackBusinessEvents: true,
  eventType: EventType.TEST_REPORT_CREATED,
  resourceType: 'test_report'
});

export const withFileUploadMonitoring = (
  handler: (request: NextRequest, context?: any) => Promise<NextResponse | Response>
) => withMonitoring(handler, {
  trackBusinessEvents: true,
  trackSecurityEvents: true,
  eventType: EventType.FILE_UPLOADED,
  resourceType: 'file'
});

export const withAuthMonitoring = (
  handler: (request: NextRequest, context?: any) => Promise<NextResponse | Response>
) => withMonitoring(handler, {
  trackBusinessEvents: true,
  trackSecurityEvents: true,
  eventType: EventType.USER_LOGIN,
  resourceType: 'auth',
  sensitiveFields: ['password', 'token', 'refresh_token']
});

// Monitoring dashboard data aggregation
export class MonitoringDashboard {
  async getDashboardData(timeRange: { start: Date; end: Date }) {
    const [
      eventStats,
      performanceMetrics,
      securityMetrics,
      businessMetrics
    ] = await Promise.all([
      this.getEventStats(timeRange),
      this.getPerformanceMetrics(timeRange),
      this.getSecurityMetrics(timeRange),
      this.getBusinessMetrics(timeRange)
    ]);

    return {
      overview: {
        totalRequests: eventStats.totalEvents,
        averageResponseTime: eventStats.averageResponseTime,
        successRate: eventStats.successRate,
        errorRate: 100 - eventStats.successRate
      },
      performance: performanceMetrics,
      security: securityMetrics,
      business: businessMetrics,
      alerts: await this.getActiveAlerts()
    };
  }

  private async getEventStats(timeRange: { start: Date; end: Date }) {
    // Implementation would query from event monitor
    return {
      totalEvents: 0,
      averageResponseTime: 0,
      successRate: 0
    };
  }

  private async getPerformanceMetrics(timeRange: { start: Date; end: Date }) {
    return {
      responseTimeP50: 0,
      responseTimeP95: 0,
      responseTimeP99: 0,
      throughput: 0,
      errorRate: 0
    };
  }

  private async getSecurityMetrics(timeRange: { start: Date; end: Date }) {
    return {
      authFailures: 0,
      unauthorizedAccess: 0,
      suspiciousActivity: 0,
      rateLimitViolations: 0
    };
  }

  private async getBusinessMetrics(timeRange: { start: Date; end: Date }) {
    return {
      appointmentsCreated: 0,
      testReportsCompleted: 0,
      paymentsProcessed: 0,
      filesUploaded: 0
    };
  }

  private async getActiveAlerts() {
    return [
      // Would return current active alerts
    ];
  }
}

export const monitoringDashboard = new MonitoringDashboard();