import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/error-handling/error-middleware';
import { withAdminSecurity } from '@/lib/security/security-middleware';
import { getSecurityThreats, getSecurityStats } from '@/lib/security/rate-limiter';
import { getEvents, EventType } from '@/lib/monitoring/event-monitor';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cache } from '@/lib/cache';
import { z } from 'zod';

const securityQuerySchema = z.object({
  timeRange: z.enum(['1h', '6h', '24h', '7d']).optional().default('24h'),
  threatType: z.enum(['rate_limit', 'brute_force', 'suspicious_pattern', 'bot_activity', 'geo_anomaly']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  limit: z.number().min(1).max(1000).optional().default(100),
  includeBlocked: z.boolean().optional().default(true)
});

async function getSecurityStatusHandler(request: NextRequest): Promise<NextResponse> {
  // Authentication is handled by withAdminSecurity middleware
  const session = await getServerSession(authOptions);
  
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());
  
  try {
    const validatedQuery = securityQuerySchema.parse({
      ...query,
      limit: query.limit ? parseInt(query.limit) : undefined,
      includeBlocked: query.includeBlocked !== 'false'
    });
    
    // Calculate time range
    const timeRange = getTimeRange(validatedQuery.timeRange);
    
    // Check cache
    const cacheKey = `security_status:${JSON.stringify(validatedQuery)}:${session?.user?.organizationId}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // Get comprehensive security data
    const [
      activeThreats,
      securityStats,
      securityEvents,
      rateLimitEvents,
      authFailures,
      suspiciousActivity,
      securityMetrics
    ] = await Promise.all([
      getActiveThreats(validatedQuery),
      getSecurityStats(),
      getSecurityEvents(timeRange, validatedQuery),
      getRateLimitEvents(timeRange),
      getAuthFailures(timeRange),
      getSuspiciousActivity(timeRange),
      calculateSecurityMetrics(timeRange)
    ]);

    const securityStatus = {
      timestamp: new Date().toISOString(),
      timeRange: validatedQuery.timeRange,
      
      // Overall security posture
      posture: {
        status: determineSecurityStatus(securityStats, securityMetrics),
        threatLevel: determineThreatLevel(activeThreats, securityMetrics),
        riskScore: calculateRiskScore(securityStats, securityMetrics),
        lastIncident: getLastIncident(securityEvents)
      },
      
      // Active threats
      threats: {
        active: activeThreats.length,
        blocked: activeThreats.filter(t => t.blocked).length,
        byType: securityStats.byType,
        bySeverity: securityStats.bySeverity,
        recent: activeThreats.slice(0, 20),
        topSources: getTopThreatSources(activeThreats)
      },
      
      // Security events
      events: {
        total: securityEvents.length,
        rateLimits: rateLimitEvents.length,
        authFailures: authFailures.length,
        suspicious: suspiciousActivity.length,
        recent: securityEvents.slice(0, 50)
      },
      
      // Security metrics
      metrics: securityMetrics,
      
      // Recommendations
      recommendations: generateSecurityRecommendations(securityStats, securityMetrics),
      
      // Alerts
      alerts: await getActiveSecurityAlerts()
    };

    // Cache the results
    await cache.set(cacheKey, securityStatus, 300); // 5 minutes

    return NextResponse.json(securityStatus);

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    throw error;
  }
}

async function blockThreatHandler(request: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  
  try {
    const body = await request.json();
    const { threatId, duration } = body;
    
    if (!threatId) {
      return NextResponse.json(
        { error: 'Threat ID required' },
        { status: 400 }
      );
    }

    // Get threat details
    const threats = getSecurityThreats();
    const threat = threats.find(t => t.id === threatId);
    
    if (!threat) {
      return NextResponse.json(
        { error: 'Threat not found' },
        { status: 404 }
      );
    }

    // Block the threat
    const blockDuration = duration || (60 * 60 * 1000); // Default 1 hour
    const blockExpires = new Date(Date.now() + blockDuration);
    
    // Update threat status
    threat.blocked = true;
    threat.blockExpires = blockExpires;
    
    // Store block in cache
    const blockKey = `security_block:${threat.source}`;
    await cache.set(blockKey, blockExpires.toISOString(), Math.ceil(blockDuration / 1000));

    // Log the manual block
    await logSecurityAction('manual_block', session?.user?.id, {
      threatId,
      threatType: threat.type,
      source: threat.source,
      duration: blockDuration,
      blockExpires: blockExpires.toISOString(),
      adminUser: session?.user?.email
    });

    return NextResponse.json({
      success: true,
      message: 'Threat blocked successfully',
      blockExpires: blockExpires.toISOString()
    });

  } catch (error: any) {
    throw error;
  }
}

async function unblockThreatHandler(request: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  
  try {
    const body = await request.json();
    const { source } = body;
    
    if (!source) {
      return NextResponse.json(
        { error: 'Source required' },
        { status: 400 }
      );
    }

    // Remove block
    const blockKey = `security_block:${source}`;
    await cache.del(blockKey);

    // Update threat status
    const threats = getSecurityThreats();
    const threat = threats.find(t => t.source === source);
    if (threat) {
      threat.blocked = false;
      threat.blockExpires = undefined;
    }

    // Log the unblock
    await logSecurityAction('manual_unblock', session?.user?.id, {
      source,
      adminUser: session?.user?.email
    });

    return NextResponse.json({
      success: true,
      message: 'Threat unblocked successfully'
    });

  } catch (error: any) {
    throw error;
  }
}

// Helper functions
async function getActiveThreats(query: any) {
  let threats = getSecurityThreats();
  
  // Apply filters
  if (query.threatType) {
    threats = threats.filter(t => t.type === query.threatType);
  }
  
  if (query.severity) {
    threats = threats.filter(t => t.severity === query.severity);
  }
  
  if (!query.includeBlocked) {
    threats = threats.filter(t => !t.blocked);
  }
  
  // Sort by last seen (most recent first)
  threats.sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());
  
  return threats.slice(0, query.limit);
}

async function getSecurityEvents(timeRange: { start: Date; end: Date }, query: any) {
  const events = await getEvents({
    types: [
      EventType.RATE_LIMIT_EXCEEDED,
      EventType.UNAUTHORIZED_ACCESS,
      EventType.SUSPICIOUS_ACTIVITY,
      EventType.SECURITY_SCAN_FAILED,
      EventType.AUTH_FAILURE
    ],
    timeRange,
    limit: query.limit
  });
  
  return events.events;
}

async function getRateLimitEvents(timeRange: { start: Date; end: Date }) {
  const events = await getEvents({
    types: [EventType.RATE_LIMIT_EXCEEDED],
    timeRange,
    limit: 1000
  });
  
  return events.events;
}

async function getAuthFailures(timeRange: { start: Date; end: Date }) {
  const events = await getEvents({
    types: [EventType.AUTH_FAILURE],
    timeRange,
    limit: 1000
  });
  
  return events.events;
}

async function getSuspiciousActivity(timeRange: { start: Date; end: Date }) {
  const events = await getEvents({
    types: [EventType.SUSPICIOUS_ACTIVITY],
    timeRange,
    limit: 1000
  });
  
  return events.events;
}

async function calculateSecurityMetrics(timeRange: { start: Date; end: Date }) {
  const [
    rateLimitEvents,
    authFailures,
    suspiciousActivity,
    securityScans
  ] = await Promise.all([
    getRateLimitEvents(timeRange),
    getAuthFailures(timeRange),
    getSuspiciousActivity(timeRange),
    getEvents({
      types: [EventType.SECURITY_SCAN_FAILED],
      timeRange,
      limit: 1000
    })
  ]);

  const totalEvents = rateLimitEvents.length + authFailures.length + 
                     suspiciousActivity.length + securityScans.events.length;

  return {
    totalSecurityEvents: totalEvents,
    rateLimitViolations: rateLimitEvents.length,
    authenticationFailures: authFailures.length,
    suspiciousActivities: suspiciousActivity.length,
    securityScanFailures: securityScans.events.length,
    
    // Event rates (per hour)
    eventRates: {
      rateLimits: calculateEventRate(rateLimitEvents, timeRange),
      authFailures: calculateEventRate(authFailures, timeRange),
      suspicious: calculateEventRate(suspiciousActivity, timeRange)
    },
    
    // Top attacking IPs
    topAttackers: getTopAttackers([
      ...rateLimitEvents,
      ...authFailures,
      ...suspiciousActivity
    ]),
    
    // Attack patterns
    attackPatterns: analyzeAttackPatterns([
      ...rateLimitEvents,
      ...authFailures,
      ...suspiciousActivity
    ])
  };
}

function determineSecurityStatus(stats: any, metrics: any): 'secure' | 'warning' | 'critical' {
  const totalThreats = stats.total || 0;
  const criticalThreats = stats.bySeverity?.critical || 0;
  const highThreats = stats.bySeverity?.high || 0;
  
  if (criticalThreats > 0 || metrics.totalSecurityEvents > 100) {
    return 'critical';
  }
  
  if (highThreats > 0 || totalThreats > 10 || metrics.totalSecurityEvents > 50) {
    return 'warning';
  }
  
  return 'secure';
}

function determineThreatLevel(threats: any[], metrics: any): 'low' | 'medium' | 'high' | 'critical' {
  const activeCriticalThreats = threats.filter(t => !t.blocked && t.severity === 'critical').length;
  const activeHighThreats = threats.filter(t => !t.blocked && t.severity === 'high').length;
  
  if (activeCriticalThreats > 0 || metrics.totalSecurityEvents > 200) {
    return 'critical';
  }
  
  if (activeHighThreats > 2 || metrics.totalSecurityEvents > 100) {
    return 'high';
  }
  
  if (threats.length > 5 || metrics.totalSecurityEvents > 50) {
    return 'medium';
  }
  
  return 'low';
}

function calculateRiskScore(stats: any, metrics: any): number {
  let score = 0;
  
  // Threat-based scoring
  score += (stats.bySeverity?.critical || 0) * 40;
  score += (stats.bySeverity?.high || 0) * 20;
  score += (stats.bySeverity?.medium || 0) * 10;
  score += (stats.bySeverity?.low || 0) * 2;
  
  // Event-based scoring
  score += Math.min(metrics.totalSecurityEvents * 0.5, 50);
  
  // Blocked threats reduce score (good security posture)
  score -= (stats.blocked || 0) * 5;
  
  return Math.max(0, Math.min(100, score));
}

function getLastIncident(events: any[]): Date | null {
  if (events.length === 0) return null;
  
  const criticalEvents = events.filter(e => 
    e.type === EventType.SECURITY_SCAN_FAILED ||
    e.type === EventType.SUSPICIOUS_ACTIVITY
  );
  
  if (criticalEvents.length === 0) return null;
  
  return criticalEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0].timestamp;
}

function getTopThreatSources(threats: any[]): Array<{ source: string; count: number; severity: string }> {
  const sourceMap = new Map<string, { count: number; maxSeverity: string }>();
  
  threats.forEach(threat => {
    const current = sourceMap.get(threat.source) || { count: 0, maxSeverity: 'low' };
    current.count++;
    
    if (getSeverityValue(threat.severity) > getSeverityValue(current.maxSeverity)) {
      current.maxSeverity = threat.severity;
    }
    
    sourceMap.set(threat.source, current);
  });
  
  return Array.from(sourceMap.entries())
    .map(([source, data]) => ({
      source,
      count: data.count,
      severity: data.maxSeverity
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function getSeverityValue(severity: string): number {
  const values = { low: 1, medium: 2, high: 3, critical: 4 };
  return values[severity as keyof typeof values] || 0;
}

function calculateEventRate(events: any[], timeRange: { start: Date; end: Date }): number {
  const hours = (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60);
  return Math.round((events.length / hours) * 100) / 100;
}

function getTopAttackers(events: any[]): Array<{ ip: string; events: number; types: string[] }> {
  const attackerMap = new Map<string, { events: number; types: Set<string> }>();
  
  events.forEach(event => {
    if (!event.ipAddress) return;
    
    const current = attackerMap.get(event.ipAddress) || { events: 0, types: new Set() };
    current.events++;
    current.types.add(event.type);
    
    attackerMap.set(event.ipAddress, current);
  });
  
  return Array.from(attackerMap.entries())
    .map(([ip, data]) => ({
      ip,
      events: data.events,
      types: Array.from(data.types)
    }))
    .sort((a, b) => b.events - a.events)
    .slice(0, 10);
}

function analyzeAttackPatterns(events: any[]): Record<string, number> {
  const patterns = new Map<string, number>();
  
  events.forEach(event => {
    const hour = new Date(event.timestamp).getHours();
    const pattern = `hour_${hour}`;
    patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
  });
  
  return Object.fromEntries(patterns);
}

function generateSecurityRecommendations(stats: any, metrics: any): string[] {
  const recommendations: string[] = [];
  
  if (metrics.authenticationFailures > 10) {
    recommendations.push('Consider implementing stricter authentication policies');
  }
  
  if (metrics.rateLimitViolations > 50) {
    recommendations.push('Review and potentially tighten rate limiting rules');
  }
  
  if (stats.bySeverity?.critical > 0) {
    recommendations.push('Immediate action required for critical security threats');
  }
  
  if (metrics.topAttackers.length > 5) {
    recommendations.push('Consider implementing IP-based blocking for repeat offenders');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Security posture is good - continue monitoring');
  }
  
  return recommendations;
}

async function getActiveSecurityAlerts(): Promise<any[]> {
  // In production, this would query actual alert system
  return [];
}

async function logSecurityAction(
  action: string,
  userId?: string,
  details: Record<string, any> = {}
): Promise<void> {
  // Log security actions for audit trail
  await cache.set(
    `security_action:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
    {
      action,
      userId,
      timestamp: new Date().toISOString(),
      details
    },
    24 * 60 * 60 // 24 hours
  );
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
    default:
      start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  }

  return { start, end };
}

// Export handlers with appropriate security
export const GET = withAdminSecurity(
  withErrorHandler(getSecurityStatusHandler, {
    category: 'system' as any,
    severity: 'medium' as any
  })
);

export const POST = withAdminSecurity(
  withErrorHandler(blockThreatHandler, {
    category: 'system' as any,
    severity: 'high' as any
  })
);

export const DELETE = withAdminSecurity(
  withErrorHandler(unblockThreatHandler, {
    category: 'system' as any,
    severity: 'medium' as any
  })
);