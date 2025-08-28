import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, isBlocked, rateLimiter } from './rate-limiter';
import { trackEvent, EventType } from '../monitoring/event-monitor';
import { handleError, ErrorCategory, ErrorSeverity } from '../error-handling/error-manager';
import { logger } from '../logger';
import { getServerSession } from 'next-auth';
// TEMP: Disabled for clean builds
// import { authOptions } from '../auth';

export interface SecurityOptions {
  enableRateLimit?: boolean;
  rateLimitRule?: string;
  enableCSRF?: boolean;
  enableCORS?: boolean;
  allowedOrigins?: string[];
  enableSecurityHeaders?: boolean;
  enableInputValidation?: boolean;
  enableThreatDetection?: boolean;
  enableIPWhitelist?: boolean;
  ipWhitelist?: string[];
  enableGeoBlocking?: boolean;
  blockedCountries?: string[];
  enableBotDetection?: boolean;
  customSecurityChecks?: Array<(request: NextRequest) => Promise<SecurityCheckResult>>;
}

export interface SecurityCheckResult {
  passed: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  shouldBlock?: boolean;
  logDetails?: Record<string, any>;
}

export interface SecurityContext {
  ipAddress: string;
  userAgent: string;
  referer?: string;
  country?: string;
  isTor?: boolean;
  isVPN?: boolean;
  isBot?: boolean;
  fingerprint: string;
  suspicionScore: number;
}

export function withSecurity(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse | Response>,
  options: SecurityOptions = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now();
    
    try {
      // Extract security context
      const securityContext = await extractSecurityContext(request);
      
      // Check if IP is blocked
      const blockStatus = await isBlocked(securityContext.ipAddress);
      if (blockStatus.blocked) {
        await trackSecurityEvent('blocked_access', request, securityContext, {
          reason: blockStatus.reason,
          expires: blockStatus.expires
        });

        return createSecurityResponse('Access denied', 403, {
          'Retry-After': blockStatus.expires 
            ? Math.ceil((blockStatus.expires.getTime() - Date.now()) / 1000).toString()
            : '3600'
        });
      }

      // Run security checks
      const securityChecks = await runSecurityChecks(request, securityContext, options);
      
      // Block if any critical security check fails
      const criticalFailures = securityChecks.filter(
        check => !check.passed && check.shouldBlock
      );

      if (criticalFailures.length > 0) {
        const reasons = criticalFailures.map(check => check.reason).join(', ');
        
        await trackSecurityEvent('security_check_failed', request, securityContext, {
          failures: criticalFailures,
          blocked: true
        });

        // Auto-block for critical security violations
        const highSeverityFailures = criticalFailures.filter(
          check => check.severity === 'high' || check.severity === 'critical'
        );

        if (highSeverityFailures.length > 0) {
          await rateLimiter.analyzeSecurityThreat({
            ipAddress: securityContext.ipAddress,
            userAgent: securityContext.userAgent,
            endpoint: new URL(request.url).pathname,
            method: request.method
          }, 'suspicious_pattern');
        }

        return createSecurityResponse(`Security check failed: ${reasons}`, 403);
      }

      // Apply rate limiting if enabled
      if (options.enableRateLimit !== false) {
        const rateLimitResult = await applyRateLimit(request, securityContext, options);
        if (!rateLimitResult.allowed) {
          return createRateLimitResponse(rateLimitResult);
        }
      }

      // Execute the handler
      let response = await handler(request, context);

      // Convert Response to NextResponse if needed
      if (response instanceof Response && !(response instanceof NextResponse)) {
        const body = await response.text();
        response = NextResponse.json(
          body ? JSON.parse(body) : null,
          { status: response.status }
        );
      }

      // Apply security headers
      if (options.enableSecurityHeaders !== false) {
        applySecurityHeaders(response as NextResponse, options);
      }

      // Apply CORS headers if enabled
      if (options.enableCORS !== false) {
        applyCORSHeaders(response as NextResponse, request, options);
      }

      // Track successful request
      await trackSecurityEvent('request_success', request, securityContext, {
        statusCode: response.status,
        duration: Date.now() - startTime
      });

      return response as NextResponse;

    } catch (error: any) {
      await handleError(error, {
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.HIGH,
        context: {
          endpoint: new URL(request.url).pathname,
          method: request.method,
          securityMiddleware: true
        }
      });

      return createSecurityResponse('Internal security error', 500);
    }
  };
}

async function extractSecurityContext(request: NextRequest): Promise<SecurityContext> {
  const ipAddress = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  const referer = request.headers.get('referer') || undefined;
  
  // Generate request fingerprint
  const fingerprint = generateFingerprint(request);
  
  // Analyze threat indicators
  const suspicionScore = calculateSuspicionScore(request, userAgent, ipAddress);
  
  return {
    ipAddress,
    userAgent,
    referer,
    fingerprint,
    suspicionScore,
    // These would be populated by external services in production
    country: undefined,
    isTor: false,
    isVPN: false,
    isBot: detectBot(userAgent)
  };
}

async function runSecurityChecks(
  request: NextRequest,
  securityContext: SecurityContext,
  options: SecurityOptions
): Promise<SecurityCheckResult[]> {
  const checks: SecurityCheckResult[] = [];

  // IP Whitelist check
  if (options.enableIPWhitelist && options.ipWhitelist) {
    const ipWhitelistCheck = checkIPWhitelist(securityContext.ipAddress, options.ipWhitelist);
    if (!ipWhitelistCheck.passed) {
      checks.push(ipWhitelistCheck);
    }
  }

  // Bot detection
  if (options.enableBotDetection !== false) {
    const botCheck = checkBotActivity(request, securityContext);
    checks.push(botCheck);
  }

  // Suspicious pattern detection
  if (options.enableThreatDetection !== false) {
    const threatCheck = await checkThreatPatterns(request, securityContext);
    checks.push(threatCheck);
  }

  // Input validation
  if (options.enableInputValidation !== false) {
    const inputCheck = await checkInputSecurity(request);
    checks.push(inputCheck);
  }

  // CSRF check
  if (options.enableCSRF !== false && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const csrfCheck = checkCSRF(request);
    checks.push(csrfCheck);
  }

  // Custom security checks
  if (options.customSecurityChecks) {
    for (const customCheck of options.customSecurityChecks) {
      try {
        const result = await customCheck(request);
        checks.push(result);
      } catch (error: any) {
        checks.push({
          passed: false,
          reason: `Custom security check failed: ${error.message}`,
          severity: 'medium',
          shouldBlock: false
        });
      }
    }
  }

  return checks;
}

function checkIPWhitelist(ipAddress: string, whitelist: string[]): SecurityCheckResult {
  const isWhitelisted = whitelist.includes(ipAddress);
  
  return {
    passed: isWhitelisted,
    reason: isWhitelisted ? undefined : 'IP address not in whitelist',
    severity: 'high',
    shouldBlock: !isWhitelisted,
    logDetails: { ipAddress, whitelist: whitelist.length }
  };
}

function checkBotActivity(request: NextRequest, securityContext: SecurityContext): SecurityCheckResult {
  const botIndicators = [
    // User agent indicators
    securityContext.userAgent.toLowerCase().includes('bot'),
    securityContext.userAgent.toLowerCase().includes('crawl'),
    securityContext.userAgent.toLowerCase().includes('spider'),
    securityContext.userAgent.toLowerCase().includes('scraper'),
    
    // Missing common headers
    !request.headers.get('accept'),
    !request.headers.get('accept-language'),
    
    // Suspicious patterns
    securityContext.suspicionScore > 7
  ];

  const botScore = botIndicators.filter(Boolean).length;
  const isBot = botScore >= 3;

  return {
    passed: !isBot,
    reason: isBot ? `Bot activity detected (score: ${botScore})` : undefined,
    severity: 'medium',
    shouldBlock: botScore >= 4, // Block obvious bots
    logDetails: {
      botScore,
      userAgent: securityContext.userAgent,
      suspicionScore: securityContext.suspicionScore
    }
  };
}

async function checkThreatPatterns(
  request: NextRequest,
  securityContext: SecurityContext
): Promise<SecurityCheckResult> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const query = url.search;
  
  const threatPatterns = [
    // SQL injection patterns
    /(union\s+select|drop\s+table|insert\s+into|delete\s+from)/i,
    
    // XSS patterns
    /<script|javascript:|on\w+\s*=/i,
    
    // Path traversal
    /\.\.(\/|\\)/,
    
    // Command injection
    /(\||&|;|`|\$\()/,
    
    // Common attack strings
    /(eval\(|exec\(|system\()/i
  ];

  const suspiciousPatterns = [
    pathname,
    query,
    securityContext.userAgent,
    securityContext.referer || ''
  ].join(' ');

  const threatMatches = threatPatterns.filter(pattern => pattern.test(suspiciousPatterns));
  const hasThreat = threatMatches.length > 0;

  return {
    passed: !hasThreat,
    reason: hasThreat ? `Suspicious patterns detected: ${threatMatches.length} matches` : undefined,
    severity: hasThreat ? 'critical' : 'low',
    shouldBlock: hasThreat,
    logDetails: {
      pathname,
      query,
      matchCount: threatMatches.length,
      suspiciousContent: hasThreat ? suspiciousPatterns.substring(0, 200) : undefined
    }
  };
}

async function checkInputSecurity(request: NextRequest): Promise<SecurityCheckResult> {
  if (!['POST', 'PUT', 'PATCH'].includes(request.method)) {
    return { passed: true };
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const body = await request.clone().text();
      
      // Check for excessively large payloads
      if (body.length > 10 * 1024 * 1024) { // 10MB
        return {
          passed: false,
          reason: 'Payload too large',
          severity: 'medium',
          shouldBlock: true,
          logDetails: { payloadSize: body.length }
        };
      }

      // Check for nested object/array attacks
      try {
        const parsed = JSON.parse(body);
        const depth = getObjectDepth(parsed);
        
        if (depth > 10) {
          return {
            passed: false,
            reason: 'JSON depth too deep',
            severity: 'high',
            shouldBlock: true,
            logDetails: { depth }
          };
        }
      } catch (parseError) {
        return {
          passed: false,
          reason: 'Invalid JSON format',
          severity: 'medium',
          shouldBlock: true
        };
      }
    }

    return { passed: true };

  } catch (error: any) {
    return {
      passed: false,
      reason: `Input validation error: ${error.message}`,
      severity: 'medium',
      shouldBlock: false
    };
  }
}

function checkCSRF(request: NextRequest): SecurityCheckResult {
  const csrfToken = request.headers.get('x-csrf-token') || 
                   request.headers.get('csrf-token');
  
  const referer = request.headers.get('referer');
  const origin = request.headers.get('origin');
  
  // Check for CSRF token (simplified check)
  if (!csrfToken && !referer && !origin) {
    return {
      passed: false,
      reason: 'Missing CSRF protection headers',
      severity: 'high',
      shouldBlock: true
    };
  }

  // Validate origin/referer matches expected domain
  const url = new URL(request.url);
  const expectedOrigin = `${url.protocol}//${url.host}`;
  
  if (origin && origin !== expectedOrigin) {
    return {
      passed: false,
      reason: 'Origin mismatch - possible CSRF attack',
      severity: 'critical',
      shouldBlock: true,
      logDetails: { origin, expectedOrigin }
    };
  }

  return { passed: true };
}

async function applyRateLimit(
  request: NextRequest,
  securityContext: SecurityContext,
  options: SecurityOptions
): Promise<any> {
  const session = await getServerSession(authOptions);
  const url = new URL(request.url);
  
  // Determine which rate limit rule to apply
  let ruleName = options.rateLimitRule || 'api_general';
  
  // Apply specific rules based on endpoint
  if (url.pathname.includes('/auth/')) {
    if (url.pathname.includes('/login')) {
      ruleName = 'auth_login';
    } else if (url.pathname.includes('/reset')) {
      ruleName = 'auth_reset';
    }
  } else if (url.pathname.includes('/payment/')) {
    ruleName = 'payment';
  } else if (url.pathname.includes('/files/')) {
    ruleName = 'file_upload';
  } else if (url.pathname.includes('/admin/')) {
    ruleName = 'admin';
  }

  const rateLimitContext = {
    ipAddress: securityContext.ipAddress,
    userId: session?.user?.id,
    organizationId: session?.user?.organizationId,
    userAgent: securityContext.userAgent,
    endpoint: url.pathname,
    method: request.method,
    sessionId: session?.user?.id ? `session_${session.user.id}` : undefined
  };

  return await checkRateLimit(ruleName, rateLimitContext);
}

function applySecurityHeaders(response: NextResponse, options: SecurityOptions): void {
  // Comprehensive security headers
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin'
  };

  for (const [header, value] of Object.entries(headers)) {
    response.headers.set(header, value);
  }
}

function applyCORSHeaders(
  response: NextResponse, 
  request: NextRequest, 
  options: SecurityOptions
): void {
  const origin = request.headers.get('origin');
  const allowedOrigins = options.allowedOrigins || [
    'http://localhost:3000',
    'https://localhost:3000'
  ];

  if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With');
    response.headers.set('Access-Control-Max-Age', '86400');
  }
}

function createSecurityResponse(
  message: string, 
  status: number, 
  additionalHeaders: Record<string, string> = {}
): NextResponse {
  const response = NextResponse.json(
    { 
      error: message,
      timestamp: new Date().toISOString(),
      code: 'SECURITY_VIOLATION'
    },
    { status }
  );

  // Add additional headers
  for (const [header, value] of Object.entries(additionalHeaders)) {
    response.headers.set(header, value);
  }

  return response;
}

function createRateLimitResponse(rateLimitResult: any): NextResponse {
  const response = NextResponse.json(
    {
      error: 'Rate limit exceeded',
      retryAfter: rateLimitResult.retryAfter,
      resetTime: rateLimitResult.resetTime,
      code: 'RATE_LIMIT_EXCEEDED'
    },
    { status: 429 }
  );

  response.headers.set('Retry-After', rateLimitResult.retryAfter?.toString() || '60');
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remainingRequests?.toString() || '0');
  
  if (rateLimitResult.resetTime) {
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toISOString());
  }

  return response;
}

async function trackSecurityEvent(
  eventType: string,
  request: NextRequest,
  securityContext: SecurityContext,
  details: Record<string, any>
): Promise<void> {
  const url = new URL(request.url);
  
  await trackEvent(EventType.SUSPICIOUS_ACTIVITY, {
    securityEventType: eventType,
    endpoint: url.pathname,
    method: request.method,
    userAgent: securityContext.userAgent,
    fingerprint: securityContext.fingerprint,
    suspicionScore: securityContext.suspicionScore,
    ...details
  }, {
    ipAddress: securityContext.ipAddress,
    userAgent: securityContext.userAgent,
    success: eventType.includes('success')
  });
}

// Helper functions
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

function generateFingerprint(request: NextRequest): string {
  const components = [
    request.headers.get('user-agent') || '',
    request.headers.get('accept') || '',
    request.headers.get('accept-language') || '',
    request.headers.get('accept-encoding') || '',
    getClientIP(request)
  ];

  return Buffer.from(components.join('|')).toString('base64').substring(0, 16);
}

function calculateSuspicionScore(
  request: NextRequest,
  userAgent: string,
  ipAddress: string
): number {
  let score = 0;

  // User agent suspicion
  if (!userAgent) score += 3;
  if (userAgent.length < 20) score += 2;
  if (userAgent.toLowerCase().includes('bot')) score += 1;

  // Header analysis
  if (!request.headers.get('accept')) score += 2;
  if (!request.headers.get('accept-language')) score += 1;
  if (!request.headers.get('referer') && request.method === 'GET') score += 1;

  // IP analysis
  if (ipAddress === 'unknown') score += 2;

  return Math.min(score, 10); // Cap at 10
}

function detectBot(userAgent: string): boolean {
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /go-http/i
  ];

  return botPatterns.some(pattern => pattern.test(userAgent));
}

function getObjectDepth(obj: any, depth = 0): number {
  if (depth > 10) return depth; // Prevent infinite recursion
  
  if (obj && typeof obj === 'object') {
    return 1 + Math.max(
      0,
      ...Object.values(obj).map(value => getObjectDepth(value, depth + 1))
    );
  }
  
  return 0;
}

// Export convenience wrappers for specific endpoint types
export const withBasicSecurity = (
  handler: (request: NextRequest, context?: any) => Promise<NextResponse | Response>
) => withSecurity(handler, {
  enableRateLimit: true,
  enableSecurityHeaders: true,
  enableThreatDetection: true
});

export const withStrictSecurity = (
  handler: (request: NextRequest, context?: any) => Promise<NextResponse | Response>
) => withSecurity(handler, {
  enableRateLimit: true,
  rateLimitRule: 'auth_login',
  enableCSRF: true,
  enableSecurityHeaders: true,
  enableThreatDetection: true,
  enableBotDetection: true,
  enableInputValidation: true
});

export const withAdminSecurity = (
  handler: (request: NextRequest, context?: any) => Promise<NextResponse | Response>
) => withSecurity(handler, {
  enableRateLimit: true,
  rateLimitRule: 'admin',
  enableCSRF: true,
  enableSecurityHeaders: true,
  enableThreatDetection: true,
  enableBotDetection: true,
  enableInputValidation: true,
  enableIPWhitelist: false // Would be configured per deployment
});

export { SecurityOptions, SecurityContext, SecurityCheckResult };