import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/error-handling/error-middleware';
import { getServerSession } from 'next-auth';
// TEMP: Disabled for clean builds  
// import { authOptions } from '@/lib/auth';
import { getApplicationHealth } from '@/lib/monitoring/application-monitor';
import { getEvents, getEventStats, EventType } from '@/lib/monitoring/event-monitor';
import { monitoringDashboard } from '@/lib/monitoring/monitoring-middleware';
import { cache } from '@/lib/cache';
import { z } from 'zod';

const dashboardQuerySchema = z.object({
  timeRange: z.enum(['1h', '6h', '24h', '7d', '30d']).optional().default('24h'),
  refresh: z.boolean().optional().default(false)
});

async function getDashboardHandler(request: NextRequest): Promise<NextResponse> {
  // Check authentication and authorization
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Only allow admin users to access monitoring dashboard
  if (session.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());
  
  try {
    const validatedQuery = dashboardQuerySchema.parse(query);
    
    // Calculate time range
    const timeRange = getTimeRange(validatedQuery.timeRange);
    
    // Check cache unless refresh is requested
    const cacheKey = `monitoring_dashboard:${validatedQuery.timeRange}:${session.user.organizationId}`;
    if (!validatedQuery.refresh) {
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        return NextResponse.json(cachedData);
      }
    }

    // Get comprehensive dashboard data
    const [
      applicationHealth,
      eventStats,
      recentEvents,
      businessMetrics,
      performanceMetrics,
      securityMetrics,
      systemMetrics
    ] = await Promise.all([
      getApplicationHealth(),
      getEventStats(timeRange),
      getEvents({ 
        timeRange, 
        limit: 50,
        severity: ['high', 'critical']
      }),
      getBusinessMetrics(timeRange),
      getPerformanceMetrics(timeRange),
      getSecurityMetrics(timeRange),
      getSystemMetrics()
    ]);

    const dashboardData = {
      timestamp: new Date().toISOString(),
      timeRange: validatedQuery.timeRange,
      
      // Overall system health
      health: {
        status: applicationHealth.status,
        uptime: applicationHealth.metrics.uptime,
        checks: applicationHealth.checks,
        lastUpdated: applicationHealth.timestamp
      },
      
      // Key performance indicators
      kpis: {
        totalRequests: eventStats.totalEvents,
        averageResponseTime: Math.round(eventStats.averageResponseTime),
        successRate: Math.round(eventStats.successRate * 100) / 100,
        errorRate: Math.round((100 - eventStats.successRate) * 100) / 100,
        activeUsers: await getActiveUserCount(timeRange),
        throughput: Math.round(eventStats.totalEvents / getHours(validatedQuery.timeRange))
      },
      
      // Event statistics
      events: {
        total: eventStats.totalEvents,
        byType: eventStats.eventsByType,
        bySeverity: eventStats.eventsBySeverity,
        recent: recentEvents.events,
        topErrors: eventStats.topErrors
      },
      
      // Business metrics
      business: businessMetrics,
      
      // Performance metrics
      performance: performanceMetrics,
      
      // Security metrics
      security: securityMetrics,
      
      // System metrics
      system: systemMetrics,
      
      // Charts data for frontend
      charts: await getChartsData(timeRange)
    };

    // Cache the results
    const cacheTimeout = getCacheTimeout(validatedQuery.timeRange);
    await cache.set(cacheKey, dashboardData, cacheTimeout);

    return NextResponse.json(dashboardData);

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    throw error; // Will be handled by error middleware
  }
}

async function getBusinessMetrics(timeRange: { start: Date; end: Date }) {
  const businessEvents = await getEvents({
    types: [
      EventType.APPOINTMENT_CREATED,
      EventType.APPOINTMENT_COMPLETED,
      EventType.TEST_REPORT_CREATED,
      EventType.TEST_REPORT_SUBMITTED,
      EventType.INVOICE_CREATED,
      EventType.INVOICE_PAID,
      EventType.PAYMENT_PROCESSED,
      EventType.CUSTOMER_CREATED
    ],
    timeRange,
    limit: 10000
  });

  const metrics = {
    appointments: {
      created: 0,
      completed: 0,
      cancelled: 0,
      completionRate: 0
    },
    testReports: {
      created: 0,
      submitted: 0,
      approved: 0,
      submissionRate: 0
    },
    revenue: {
      invoicesCreated: 0,
      invoicesPaid: 0,
      totalProcessed: 0,
      paymentSuccessRate: 0
    },
    customers: {
      newRegistrations: 0,
      totalActive: 0,
      retentionRate: 0
    }
  };

  // Calculate metrics from events
  for (const event of businessEvents.events) {
    switch (event.type) {
      case EventType.APPOINTMENT_CREATED:
        metrics.appointments.created++;
        break;
      case EventType.APPOINTMENT_COMPLETED:
        metrics.appointments.completed++;
        break;
      case EventType.APPOINTMENT_CANCELLED:
        metrics.appointments.cancelled++;
        break;
      case EventType.TEST_REPORT_CREATED:
        metrics.testReports.created++;
        break;
      case EventType.TEST_REPORT_SUBMITTED:
        metrics.testReports.submitted++;
        break;
      case EventType.INVOICE_CREATED:
        metrics.revenue.invoicesCreated++;
        break;
      case EventType.INVOICE_PAID:
        metrics.revenue.invoicesPaid++;
        break;
      case EventType.CUSTOMER_CREATED:
        metrics.customers.newRegistrations++;
        break;
    }
  }

  // Calculate rates
  if (metrics.appointments.created > 0) {
    metrics.appointments.completionRate = 
      Math.round((metrics.appointments.completed / metrics.appointments.created) * 100);
  }

  if (metrics.testReports.created > 0) {
    metrics.testReports.submissionRate = 
      Math.round((metrics.testReports.submitted / metrics.testReports.created) * 100);
  }

  if (metrics.revenue.invoicesCreated > 0) {
    metrics.revenue.paymentSuccessRate = 
      Math.round((metrics.revenue.invoicesPaid / metrics.revenue.invoicesCreated) * 100);
  }

  return metrics;
}

async function getPerformanceMetrics(timeRange: { start: Date; end: Date }) {
  const performanceEvents = await getEvents({
    types: [EventType.DATABASE_QUERY, EventType.EXTERNAL_API_CALL],
    timeRange,
    limit: 10000
  });

  const responseTimesMs: number[] = [];
  let slowQueries = 0;
  let totalQueries = 0;

  for (const event of performanceEvents.events) {
    if (event.duration !== undefined) {
      responseTimesMs.push(event.duration);
      totalQueries++;
      
      if (event.duration > 1000) { // Queries over 1 second
        slowQueries++;
      }
    }
  }

  responseTimesMs.sort((a, b) => a - b);

  return {
    averageResponseTime: responseTimesMs.length > 0 
      ? Math.round(responseTimesMs.reduce((a, b) => a + b, 0) / responseTimesMs.length)
      : 0,
    p50ResponseTime: responseTimesMs.length > 0 
      ? responseTimesMs[Math.floor(responseTimesMs.length * 0.5)]
      : 0,
    p95ResponseTime: responseTimesMs.length > 0 
      ? responseTimesMs[Math.floor(responseTimesMs.length * 0.95)]
      : 0,
    p99ResponseTime: responseTimesMs.length > 0 
      ? responseTimesMs[Math.floor(responseTimesMs.length * 0.99)]
      : 0,
    slowQueryCount: slowQueries,
    slowQueryRate: totalQueries > 0 ? Math.round((slowQueries / totalQueries) * 100) : 0,
    totalQueries
  };
}

async function getSecurityMetrics(timeRange: { start: Date; end: Date }) {
  const securityEvents = await getEvents({
    types: [
      EventType.AUTH_FAILURE,
      EventType.UNAUTHORIZED_ACCESS,
      EventType.SUSPICIOUS_ACTIVITY,
      EventType.RATE_LIMIT_EXCEEDED,
      EventType.SECURITY_SCAN_FAILED
    ],
    timeRange,
    limit: 10000
  });

  const metrics = {
    authFailures: 0,
    unauthorizedAccess: 0,
    suspiciousActivity: 0,
    rateLimitViolations: 0,
    securityScanFailures: 0,
    uniqueThreats: new Set<string>(),
    topThreats: [] as Array<{ type: string; count: number; lastSeen: Date }>
  };

  const threatCounts = new Map<string, { count: number; lastSeen: Date }>();

  for (const event of securityEvents.events) {
    switch (event.type) {
      case EventType.AUTH_FAILURE:
        metrics.authFailures++;
        break;
      case EventType.UNAUTHORIZED_ACCESS:
        metrics.unauthorizedAccess++;
        break;
      case EventType.SUSPICIOUS_ACTIVITY:
        metrics.suspiciousActivity++;
        break;
      case EventType.RATE_LIMIT_EXCEEDED:
        metrics.rateLimitViolations++;
        break;
      case EventType.SECURITY_SCAN_FAILED:
        metrics.securityScanFailures++;
        break;
    }

    // Track unique threats by IP address
    if (event.ipAddress) {
      metrics.uniqueThreats.add(event.ipAddress);
      
      const current = threatCounts.get(event.ipAddress) || { count: 0, lastSeen: new Date(0) };
      threatCounts.set(event.ipAddress, {
        count: current.count + 1,
        lastSeen: event.timestamp > current.lastSeen ? event.timestamp : current.lastSeen
      });
    }
  }

  // Get top threats
  metrics.topThreats = Array.from(threatCounts.entries())
    .map(([ip, data]) => ({ type: ip, count: data.count, lastSeen: data.lastSeen }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    ...metrics,
    uniqueThreats: metrics.uniqueThreats.size
  };
}

async function getSystemMetrics() {
  const memoryUsage = process.memoryUsage();
  
  return {
    memory: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      usagePercentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
    },
    process: {
      uptime: Math.round(process.uptime()),
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };
}

async function getActiveUserCount(timeRange: { start: Date; end: Date }): Promise<number> {
  const userEvents = await getEvents({
    types: [EventType.USER_LOGIN, EventType.EXTERNAL_API_CALL],
    timeRange,
    limit: 10000
  });

  const activeUsers = new Set<string>();
  
  for (const event of userEvents.events) {
    if (event.userId) {
      activeUsers.add(event.userId);
    }
  }

  return activeUsers.size;
}

async function getChartsData(timeRange: { start: Date; end: Date }) {
  // Generate time series data for charts
  const events = await getEvents({ timeRange, limit: 10000 });
  
  // Group events by hour for time series
  const hourlyData = new Map<string, {
    timestamp: string;
    requests: number;
    errors: number;
    averageResponseTime: number;
    responseTimes: number[];
  }>();

  // Initialize hourly buckets
  const start = new Date(timeRange.start);
  const end = new Date(timeRange.end);
  const diffHours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
  
  for (let i = 0; i < diffHours; i++) {
    const hour = new Date(start.getTime() + i * 60 * 60 * 1000);
    const key = hour.toISOString().substring(0, 13); // Hour precision
    
    hourlyData.set(key, {
      timestamp: hour.toISOString(),
      requests: 0,
      errors: 0,
      averageResponseTime: 0,
      responseTimes: []
    });
  }

  // Aggregate event data
  for (const event of events.events) {
    const hourKey = event.timestamp.toISOString().substring(0, 13);
    const hourData = hourlyData.get(hourKey);
    
    if (hourData) {
      hourData.requests++;
      
      if (!event.success) {
        hourData.errors++;
      }
      
      if (event.duration !== undefined) {
        hourData.responseTimes.push(event.duration);
      }
    }
  }

  // Calculate averages
  for (const data of hourlyData.values()) {
    if (data.responseTimes.length > 0) {
      data.averageResponseTime = Math.round(
        data.responseTimes.reduce((a, b) => a + b, 0) / data.responseTimes.length
      );
    }
  }

  return {
    timeSeries: Array.from(hourlyData.values()).sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ),
    eventTypeDistribution: events.events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };
}

function getTimeRange(range: string): { start: Date; end: Date } {
  const end = new Date();
  let start: Date;

  switch (range) {
    case '1h':
      start = new Date(end.getTime() - 60 * 60 * 1000);
      break;
    case '6h':
      start = new Date(end.getTime() - 6 * 60 * 60 * 1000);
      break;
    case '24h':
      start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  }

  return { start, end };
}

function getHours(range: string): number {
  switch (range) {
    case '1h': return 1;
    case '6h': return 6;
    case '24h': return 24;
    case '7d': return 24 * 7;
    case '30d': return 24 * 30;
    default: return 24;
  }
}

function getCacheTimeout(range: string): number {
  switch (range) {
    case '1h': return 60; // 1 minute
    case '6h': return 300; // 5 minutes
    case '24h': return 600; // 10 minutes
    case '7d': return 1800; // 30 minutes
    case '30d': return 3600; // 1 hour
    default: return 600;
  }
}

export const GET = withErrorHandler(getDashboardHandler, {
  category: 'external_service' as any,
  severity: 'medium' as any
});