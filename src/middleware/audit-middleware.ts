/**
 * Audit Middleware
 * Automatically logs API requests and user actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auditLogger, AuditEventType } from '@/lib/audit-logger';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface AuditMiddlewareOptions {
  excludePaths?: string[];
  logAllRequests?: boolean;
  logFailuresOnly?: boolean;
  sensitiveEndpoints?: string[];
}

const DEFAULT_OPTIONS: AuditMiddlewareOptions = {
  excludePaths: [
    '/api/health',
    '/api/monitoring',
    '/_next',
    '/favicon.ico',
    '/manifest.json'
  ],
  logAllRequests: false,
  logFailuresOnly: false,
  sensitiveEndpoints: [
    '/api/auth',
    '/api/customers',
    '/api/payments',
    '/api/admin',
    '/api/test-reports'
  ]
};

export function withAuditLogging(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: AuditMiddlewareOptions = {}
) {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const pathname = request.nextUrl.pathname;
    const method = request.method;
    
    // Skip excluded paths
    if (config.excludePaths?.some(path => pathname.startsWith(path))) {
      return handler(request);
    }

    // Get user context
    const userContext = await getUserContext(request);
    
    // Set audit context
    if (userContext.userId) {
      auditLogger.setContext({
        userId: userContext.userId,
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent') || undefined,
        sessionId: userContext.sessionId,
        requestId: request.headers.get('x-request-id') || undefined
      });
    }

    let response: NextResponse;
    let error: Error | null = null;

    try {
      // Execute the handler
      response = await handler(request);
    } catch (err) {
      error = err as Error;
      response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;
    const statusCode = response.status;
    const isError = statusCode >= 400;
    const isSensitive = config.sensitiveEndpoints?.some(endpoint => 
      pathname.startsWith(endpoint)
    );

    // Determine if we should log this request
    const shouldLog = 
      config.logAllRequests ||
      (config.logFailuresOnly && isError) ||
      isSensitive ||
      isError;

    if (shouldLog) {
      await logAPIRequest({
        method,
        pathname,
        statusCode,
        duration,
        error: error?.message,
        userContext,
        requestSize: getRequestSize(request),
        responseSize: getResponseSize(response),
        isSensitive
      });
    }

    // Log specific actions based on endpoint and method
    await logSpecificActions(request, response, userContext);

    // Clear audit context
    auditLogger.clearContext();

    return response;
  };
}

async function getUserContext(request: NextRequest): Promise<{
  userId?: string;
  userEmail?: string;
  userRole?: string;
  sessionId?: string;
}> {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Try to get additional user info
      const { data: profile } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', user.id)
        .single();

      return {
        userId: user.id,
        userEmail: user.email,
        userRole: profile?.role || 'customer',
        sessionId: request.cookies.get('sb-access-token')?.value?.substring(0, 16)
      };
    }

    return {};
  } catch (error) {
    return {};
  }
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('remote-addr');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP.trim();
  }
  if (remoteAddr) {
    return remoteAddr.trim();
  }

  return 'unknown';
}

function getRequestSize(request: NextRequest): number {
  const contentLength = request.headers.get('content-length');
  return contentLength ? parseInt(contentLength, 10) : 0;
}

function getResponseSize(response: NextResponse): number {
  const contentLength = response.headers.get('content-length');
  return contentLength ? parseInt(contentLength, 10) : 0;
}

async function logAPIRequest({
  method,
  pathname,
  statusCode,
  duration,
  error,
  userContext,
  requestSize,
  responseSize,
  isSensitive
}: {
  method: string;
  pathname: string;
  statusCode: number;
  duration: number;
  error?: string;
  userContext: any;
  requestSize: number;
  responseSize: number;
  isSensitive: boolean;
}) {
  await auditLogger.logApiRequest(
    method,
    pathname,
    statusCode,
    duration,
    userContext.userId,
    statusCode < 400,
    error?.message
  );

  // Log security events for sensitive endpoints
  if (isSensitive && statusCode === 401) {
    await auditLogger.logSecurityEvent(
      AuditEventType.SECURITY_ALERT,
      'Unauthorized access attempt',
      'high',
      userContext.userId,
      {
        endpoint: pathname,
        method,
        userAgent: userContext.userAgent,
        ipAddress: userContext.ipAddress
      }
    );
  }

  if (isSensitive && statusCode === 403) {
    await auditLogger.logSecurityEvent(
      AuditEventType.SECURITY_ALERT,
      'Forbidden access attempt',
      'high',
      userContext.userId,
      {
        endpoint: pathname,
        method,
        userId: userContext.userId,
        userEmail: userContext.userEmail
      },
      'high'
    );
  }
}

async function logSpecificActions(
  request: NextRequest,
  response: NextResponse,
  userContext: any
) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;
  const isSuccess = response.status < 400;

  // Authentication endpoints
  if (pathname.includes('/api/auth/login')) {
    await auditLogger.logAuth(
      isSuccess ? AuditEventType.LOGIN_SUCCESS : AuditEventType.LOGIN_FAILURE,
      userContext.userId,
      userContext.sessionId,
      userContext.ipAddress,
      userContext.userAgent,
      isSuccess,
      isSuccess ? undefined : `Login failed with status ${response.status}`
    );
  }

  if (pathname.includes('/api/auth/logout')) {
    await auditLogger.logAuth(
      AuditEventType.LOGOUT,
      userContext.userId,
      userContext.sessionId,
      userContext.ipAddress,
      userContext.userAgent,
      isSuccess
    );
  }

  // Customer data operations
  if (pathname.startsWith('/api/customers') && isSuccess) {
    const customerId = extractEntityId(pathname);
    
    switch (method) {
      case 'POST':
        await auditLogger.logDataChange('create', 'customer', customerId || 'new', {});
        break;
      case 'PUT':
      case 'PATCH':
        await auditLogger.logDataChange('update', 'customer', customerId || 'unknown', {});
        break;
      case 'DELETE':
        await auditLogger.logDataChange('delete', 'customer', customerId || 'unknown', {});
        break;
      case 'GET':
        if (customerId) {
          await auditLogger.logDataAccess('customer', customerId, userContext.userId, 'read');
        }
        break;
    }
  }

  // Payment operations
  if (pathname.startsWith('/api/payments') || pathname.includes('/pay')) {
    if (method === 'POST' && isSuccess) {
      await auditLogger.logPayment(
        AuditEventType.PAYMENT_INITIATED,
        userContext.userId || 'anonymous',
        extractEntityId(pathname) || undefined,
        undefined, // Don't log amount in middleware
        undefined, // Don't log payment method in middleware
        isSuccess,
        isSuccess ? undefined : `Payment failed with status ${response.status}`
      );
    }
  }

  // Admin operations
  if (pathname.startsWith('/api/admin') && userContext.userId) {
    const operation = pathname.split('/').pop() || 'unknown';
    
    await auditLogger.logSystem(
      AuditEventType.SETTINGS_CHANGED,
      'medium',
      isSuccess,
      isSuccess ? undefined : `Admin operation failed: ${operation}`,
      {
        operation,
        endpoint: pathname,
        method
      }
    );
  }

  // Data export operations
  if (pathname.includes('/export') && method === 'POST' && isSuccess) {
    await auditLogger.logSystem(
      AuditEventType.DATA_EXPORT,
      'medium',
      isSuccess,
      undefined,
      {
        exportType: extractExportType(pathname),
        endpoint: pathname
      }
    );
  }
}

function extractEntityId(pathname: string): string | null {
  const segments = pathname.split('/');
  const lastSegment = segments[segments.length - 1];
  
  // Check if last segment looks like a UUID or ID
  if (lastSegment && (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastSegment) ||
    /^\d+$/.test(lastSegment)
  )) {
    return lastSegment;
  }
  
  return null;
}

function extractExportType(pathname: string): string {
  if (pathname.includes('/customers')) return 'customers';
  if (pathname.includes('/appointments')) return 'appointments';
  if (pathname.includes('/invoices')) return 'invoices';
  if (pathname.includes('/reports')) return 'reports';
  return 'unknown';
}

// Middleware for specific operations
export const auditAuthMiddleware = withAuditLogging(
  async (request: NextRequest) => NextResponse.next(),
  {
    logAllRequests: true,
    sensitiveEndpoints: ['/api/auth']
  }
);

export const auditDataMiddleware = withAuditLogging(
  async (request: NextRequest) => NextResponse.next(),
  {
    logAllRequests: true,
    sensitiveEndpoints: ['/api/customers', '/api/payments', '/api/invoices']
  }
);

export const auditAdminMiddleware = withAuditLogging(
  async (request: NextRequest) => NextResponse.next(),
  {
    logAllRequests: true,
    sensitiveEndpoints: ['/api/admin']
  }
);

export default withAuditLogging;