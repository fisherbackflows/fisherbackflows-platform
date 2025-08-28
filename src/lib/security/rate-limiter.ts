import { cache } from '../cache';
import { logger } from '../logger';
import { trackEvent, EventType } from '../monitoring/event-monitor';
import { handleError, ErrorCategory, ErrorSeverity } from '../error-handling/error-manager';

export interface RateLimitRule {
  identifier: string;
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (identifier: string, context: RateLimitContext) => string;
  onLimitReached?: (context: RateLimitContext) => Promise<void>;
  whitelist?: string[];
  blockDuration?: number; // Duration to block after limit exceeded
}

export interface RateLimitContext {
  ipAddress: string;
  userId?: string;
  organizationId?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  sessionId?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests?: number;
  resetTime?: Date;
  totalHits: number;
  retryAfter?: number;
  blockExpires?: Date;
}

export interface SecurityThreat {
  id: string;
  type: 'rate_limit' | 'brute_force' | 'suspicious_pattern' | 'bot_activity' | 'geo_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  details: Record<string, any>;
  firstSeen: Date;
  lastSeen: Date;
  occurrences: number;
  blocked: boolean;
  blockExpires?: Date;
}

class RateLimiter {
  private rules = new Map<string, RateLimitRule>();
  private blocks = new Map<string, Date>(); // Temporary blocks
  private securityThreats = new Map<string, SecurityThreat>();
  private suspiciousPatterns = new Map<string, {
    count: number;
    firstSeen: Date;
    lastSeen: Date;
    patterns: string[];
  }>();

  constructor() {
    this.initializeDefaultRules();
    this.startSecurityMonitoring();
    this.startCleanupTasks();
  }

  registerRule(ruleName: string, rule: RateLimitRule): void {
    this.rules.set(ruleName, rule);
  }

  async checkLimit(
    ruleName: string,
    context: RateLimitContext
  ): Promise<RateLimitResult> {
    try {
      const rule = this.rules.get(ruleName);
      if (!rule) {
        throw new Error(`Rate limit rule '${ruleName}' not found`);
      }

      // Check if source is whitelisted
      if (rule.whitelist && this.isWhitelisted(context.ipAddress, rule.whitelist)) {
        return {
          allowed: true,
          totalHits: 0,
          remainingRequests: rule.maxRequests
        };
      }

      // Generate cache key
      const key = rule.keyGenerator 
        ? rule.keyGenerator(rule.identifier, context)
        : this.generateDefaultKey(rule.identifier, context);

      // Check if currently blocked
      const blockKey = `block:${key}`;
      const blockExpires = await cache.get(blockKey);
      if (blockExpires && new Date(blockExpires) > new Date()) {
        await this.recordSecurityEvent('rate_limit_exceeded', context, {
          rule: ruleName,
          blocked: true,
          blockExpires
        });

        return {
          allowed: false,
          totalHits: rule.maxRequests,
          remainingRequests: 0,
          retryAfter: Math.ceil((new Date(blockExpires).getTime() - Date.now()) / 1000),
          blockExpires: new Date(blockExpires)
        };
      }

      // Get current count
      const countKey = `rate_limit:${key}`;
      const currentData = await cache.get(countKey) || {
        count: 0,
        windowStart: Date.now(),
        requests: []
      };

      const now = Date.now();
      const windowStart = currentData.windowStart;
      const windowEnd = windowStart + rule.windowMs;

      // Check if we need to reset the window
      if (now > windowEnd) {
        currentData.count = 0;
        currentData.windowStart = now;
        currentData.requests = [];
      }

      // Filter out old requests for accurate counting
      currentData.requests = currentData.requests.filter((timestamp: number) => 
        timestamp > now - rule.windowMs
      );

      const currentCount = currentData.requests.length;
      const remainingRequests = Math.max(0, rule.maxRequests - currentCount - 1);

      // Check if limit exceeded
      if (currentCount >= rule.maxRequests) {
        // Apply temporary block if configured
        if (rule.blockDuration && rule.blockDuration > 0) {
          const blockExpires = new Date(now + rule.blockDuration);
          await cache.set(blockKey, blockExpires.toISOString(), Math.ceil(rule.blockDuration / 1000));
        }

        // Record security event
        await this.recordSecurityEvent('rate_limit_exceeded', context, {
          rule: ruleName,
          currentCount,
          maxRequests: rule.maxRequests,
          windowMs: rule.windowMs
        });

        // Execute custom callback
        if (rule.onLimitReached) {
          await rule.onLimitReached(context);
        }

        // Detect potential security threats
        await this.analyzeSecurityThreat(context, 'rate_limit');

        return {
          allowed: false,
          totalHits: currentCount,
          remainingRequests: 0,
          resetTime: new Date(windowEnd),
          retryAfter: Math.ceil((windowEnd - now) / 1000)
        };
      }

      // Update count
      currentData.requests.push(now);
      currentData.count = currentData.requests.length;

      // Store updated data
      const ttl = Math.ceil((windowEnd - now) / 1000);
      await cache.set(countKey, currentData, ttl);

      return {
        allowed: true,
        totalHits: currentData.count,
        remainingRequests,
        resetTime: new Date(windowEnd)
      };

    } catch (error: any) {
      await handleError(error, {
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.HIGH,
        context: { ruleName, rateLimitContext: context }
      });

      // Fail open - allow request if rate limiter fails
      return {
        allowed: true,
        totalHits: 0,
        remainingRequests: 999999
      };
    }
  }

  async analyzeSecurityThreat(
    context: RateLimitContext,
    threatType: SecurityThreat['type']
  ): Promise<void> {
    const threatId = `${threatType}:${context.ipAddress}`;
    
    let threat = this.securityThreats.get(threatId);
    
    if (!threat) {
      threat = {
        id: threatId,
        type: threatType,
        severity: this.determineThreatSeverity(threatType, context),
        source: context.ipAddress,
        details: {
          userAgent: context.userAgent,
          endpoint: context.endpoint,
          method: context.method,
          userId: context.userId
        },
        firstSeen: new Date(),
        lastSeen: new Date(),
        occurrences: 1,
        blocked: false
      };
    } else {
      threat.occurrences++;
      threat.lastSeen = new Date();
      threat.details = { ...threat.details, ...context };
    }

    this.securityThreats.set(threatId, threat);

    // Auto-block high severity threats
    if (threat.severity === 'high' || threat.severity === 'critical') {
      if (threat.occurrences >= this.getBlockThreshold(threat.type)) {
        await this.blockThreat(threat);
      }
    }

    // Store in cache for persistence
    await cache.set(`security_threat:${threatId}`, threat, 24 * 60 * 60); // 24 hours
  }

  async blockThreat(threat: SecurityThreat): Promise<void> {
    const blockDuration = this.getBlockDuration(threat.type, threat.severity);
    const blockExpires = new Date(Date.now() + blockDuration);
    
    threat.blocked = true;
    threat.blockExpires = blockExpires;

    // Store block in cache
    const blockKey = `security_block:${threat.source}`;
    await cache.set(blockKey, blockExpires.toISOString(), Math.ceil(blockDuration / 1000));

    // Log security block
    await logger.warn('Security threat blocked', {
      threatId: threat.id,
      source: threat.source,
      type: threat.type,
      severity: threat.severity,
      occurrences: threat.occurrences,
      blockExpires: blockExpires.toISOString()
    });

    // Track security event
    await trackEvent(EventType.SUSPICIOUS_ACTIVITY, {
      threatType: threat.type,
      source: threat.source,
      action: 'blocked',
      occurrences: threat.occurrences
    }, {
      ipAddress: threat.source,
      success: true
    });
  }

  async isBlocked(ipAddress: string): Promise<{ blocked: boolean; reason?: string; expires?: Date }> {
    const blockKey = `security_block:${ipAddress}`;
    const blockExpires = await cache.get(blockKey);
    
    if (blockExpires && new Date(blockExpires) > new Date()) {
      const threat = this.securityThreats.get(ipAddress);
      return {
        blocked: true,
        reason: threat ? `Security threat: ${threat.type}` : 'Rate limit exceeded',
        expires: new Date(blockExpires)
      };
    }

    return { blocked: false };
  }

  private initializeDefaultRules(): void {
    // General API rate limiting
    this.registerRule('api_general', {
      identifier: 'api_general',
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 1000,
      blockDuration: 5 * 60 * 1000, // 5 minutes
      keyGenerator: (_, context) => `${context.ipAddress}:${context.userId || 'anonymous'}`
    });

    // Authentication endpoints
    this.registerRule('auth_login', {
      identifier: 'auth_login',
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // Strict limit for login attempts
      blockDuration: 30 * 60 * 1000, // 30 minutes
      keyGenerator: (_, context) => context.ipAddress,
      onLimitReached: async (context) => {
        await this.analyzeSecurityThreat(context, 'brute_force');
      }
    });

    // Password reset endpoints
    this.registerRule('auth_reset', {
      identifier: 'auth_reset',
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
      blockDuration: 60 * 60 * 1000, // 1 hour
      keyGenerator: (_, context) => context.ipAddress
    });

    // Payment endpoints
    this.registerRule('payment', {
      identifier: 'payment',
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
      blockDuration: 60 * 60 * 1000, // 1 hour
      keyGenerator: (_, context) => `${context.ipAddress}:${context.userId || 'anonymous'}`
    });

    // File upload endpoints
    this.registerRule('file_upload', {
      identifier: 'file_upload',
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 50,
      blockDuration: 30 * 60 * 1000, // 30 minutes
      keyGenerator: (_, context) => `${context.ipAddress}:${context.userId || 'anonymous'}`
    });

    // Admin endpoints
    this.registerRule('admin', {
      identifier: 'admin',
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 100,
      blockDuration: 60 * 60 * 1000, // 1 hour
      keyGenerator: (_, context) => context.userId || context.ipAddress,
      whitelist: ['127.0.0.1', '::1'] // Localhost
    });

    // User registration
    this.registerRule('registration', {
      identifier: 'registration',
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      maxRequests: 5,
      blockDuration: 24 * 60 * 60 * 1000, // 24 hours
      keyGenerator: (_, context) => context.ipAddress
    });
  }

  private generateDefaultKey(identifier: string, context: RateLimitContext): string {
    return `${identifier}:${context.ipAddress}`;
  }

  private isWhitelisted(ipAddress: string, whitelist: string[]): boolean {
    return whitelist.includes(ipAddress);
  }

  private async recordSecurityEvent(
    eventType: string,
    context: RateLimitContext,
    details: Record<string, any>
  ): Promise<void> {
    await trackEvent(EventType.RATE_LIMIT_EXCEEDED, {
      eventType,
      endpoint: context.endpoint,
      method: context.method,
      userAgent: context.userAgent,
      ...details
    }, {
      userId: context.userId,
      organizationId: context.organizationId,
      ipAddress: context.ipAddress,
      sessionId: context.sessionId,
      success: false
    });
  }

  private determineThreatSeverity(
    threatType: SecurityThreat['type'],
    context: RateLimitContext
  ): SecurityThreat['severity'] {
    switch (threatType) {
      case 'brute_force':
        return 'critical';
      case 'rate_limit':
        return 'high';
      case 'suspicious_pattern':
        return 'medium';
      case 'bot_activity':
        return 'medium';
      case 'geo_anomaly':
        return 'low';
      default:
        return 'low';
    }
  }

  private getBlockThreshold(threatType: SecurityThreat['type']): number {
    switch (threatType) {
      case 'brute_force': return 3;
      case 'rate_limit': return 5;
      case 'suspicious_pattern': return 10;
      case 'bot_activity': return 20;
      default: return 10;
    }
  }

  private getBlockDuration(
    threatType: SecurityThreat['type'],
    severity: SecurityThreat['severity']
  ): number {
    const baseDurations = {
      'brute_force': 60 * 60 * 1000, // 1 hour
      'rate_limit': 30 * 60 * 1000, // 30 minutes
      'suspicious_pattern': 15 * 60 * 1000, // 15 minutes
      'bot_activity': 5 * 60 * 1000, // 5 minutes
      'geo_anomaly': 5 * 60 * 1000 // 5 minutes
    };

    const severityMultipliers = {
      'low': 1,
      'medium': 2,
      'high': 4,
      'critical': 8
    };

    const baseDuration = baseDurations[threatType] || 15 * 60 * 1000;
    const multiplier = severityMultipliers[severity] || 1;

    return baseDuration * multiplier;
  }

  private startSecurityMonitoring(): void {
    // Monitor for suspicious patterns every 30 seconds
    setInterval(async () => {
      try {
        await this.detectSuspiciousPatterns();
      } catch (error: any) {
        await logger.error('Security monitoring failed', { error: error.message });
      }
    }, 30000);
  }

  private startCleanupTasks(): void {
    // Cleanup old threats every hour
    setInterval(async () => {
      try {
        await this.cleanupOldThreats();
      } catch (error: any) {
        await logger.error('Threat cleanup failed', { error: error.message });
      }
    }, 60 * 60 * 1000);
  }

  private async detectSuspiciousPatterns(): Promise<void> {
    // Implementation would analyze request patterns for anomalies
    // For now, this is a placeholder for advanced security analysis
  }

  private async cleanupOldThreats(): Promise<void> {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [threatId, threat] of this.securityThreats.entries()) {
      if (threat.lastSeen.getTime() < cutoffTime) {
        this.securityThreats.delete(threatId);
        await cache.del(`security_threat:${threatId}`);
      }
    }
  }

  // Public methods for monitoring
  getActiveThreats(): SecurityThreat[] {
    return Array.from(this.securityThreats.values())
      .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());
  }

  getThreatStats(): {
    total: number;
    blocked: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  } {
    const threats = Array.from(this.securityThreats.values());
    
    return {
      total: threats.length,
      blocked: threats.filter(t => t.blocked).length,
      bySeverity: threats.reduce((acc, threat) => {
        acc[threat.severity] = (acc[threat.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byType: threats.reduce((acc, threat) => {
        acc[threat.type] = (acc[threat.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

export const rateLimiter = new RateLimiter();

// Convenience functions
export const checkRateLimit = (
  ruleName: string,
  context: RateLimitContext
): Promise<RateLimitResult> => {
  return rateLimiter.checkLimit(ruleName, context);
};

export const isBlocked = (ipAddress: string) => {
  return rateLimiter.isBlocked(ipAddress);
};

export const getSecurityThreats = (): SecurityThreat[] => {
  return rateLimiter.getActiveThreats();
};

export const getSecurityStats = () => {
  return rateLimiter.getThreatStats();
};