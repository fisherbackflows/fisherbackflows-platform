/**
 * Error Boundary Utilities
 */

import { auditLogger, AuditEventType } from '@/lib/audit-logger';

export interface ErrorReport {
  error: Error;
  errorInfo?: React.ErrorInfo;
  context?: string;
  userId?: string;
  url?: string;
  userAgent?: string;
  timestamp?: Date;
}

/**
 * Report error to external service (e.g., Sentry, LogRocket, etc.)
 */
export async function reportError(report: ErrorReport): Promise<void> {
  try {
    // Log to console for immediate visibility
    console.error('🔴 Error Report:', {
      error: report.error.message,
      stack: report.error.stack,
      context: report.context,
      url: report.url || (typeof window !== 'undefined' ? window.location.href : 'unknown')
    });

    // Log to audit system
    await auditLogger.logEvent({
      eventType: AuditEventType.SYSTEM_ERROR,
      userId: report.userId,
      severity: 'high',
      success: false,
      errorMessage: report.error.message,
      metadata: {
        errorName: report.error.name,
        errorStack: report.error.stack,
        componentStack: report.errorInfo?.componentStack,
        context: report.context,
        url: report.url || (typeof window !== 'undefined' ? window.location.href : 'unknown'),
        userAgent: report.userAgent || (typeof window !== 'undefined' ? navigator.userAgent : 'unknown'),
        timestamp: report.timestamp || new Date()
      },
      timestamp: report.timestamp || new Date()
    });

    // In production, send to external error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry, LogRocket, etc.
      // await sendToErrorReportingService(report);
    }
  } catch (error) {
    console.error('Failed to report error:', error);
  }
}

/**
 * Log client-side errors (for window.onerror, unhandledrejection, etc.)
 */
export async function logClientError(
  message: string,
  source?: string,
  lineno?: number,
  colno?: number,
  error?: Error
): Promise<void> {
  const errorReport: ErrorReport = {
    error: error || new Error(message),
    context: 'client-side',
    url: source,
    timestamp: new Date()
  };

  await reportError(errorReport);
}

/**
 * Get error boundary context information
 */
export function getErrorContext(): {
  url: string;
  userAgent: string;
  timestamp: string;
  memory?: string;
} {
  const context = {
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
    timestamp: new Date().toISOString(),
  };

  // Add memory usage if available
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    (context as any).memory = `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB / ${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`;
  }

  return context;
}

/**
 * Check if error is likely due to network issues
 */
export function isNetworkError(error: Error): boolean {
  const networkErrorPatterns = [
    /fetch/i,
    /network/i,
    /timeout/i,
    /failed to fetch/i,
    /ERR_NETWORK/i,
    /ERR_INTERNET_DISCONNECTED/i,
    /NetworkError/i,
    /net::/i
  ];

  return networkErrorPatterns.some(pattern => 
    pattern.test(error.message) || pattern.test(error.name)
  );
}

/**
 * Check if error is likely a user-recoverable error
 */
export function isRecoverableError(error: Error): boolean {
  const recoverablePatterns = [
    /timeout/i,
    /network/i,
    /fetch/i,
    /connection/i,
    /temporary/i,
    /retry/i
  ];

  return recoverablePatterns.some(pattern => 
    pattern.test(error.message) || pattern.test(error.name)
  );
}

/**
 * Generate user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: Error): string {
  if (isNetworkError(error)) {
    return 'We\'re having trouble connecting to our servers. Please check your internet connection and try again.';
  }

  // Common error patterns
  if (error.message.includes('unauthorized') || error.message.includes('401')) {
    return 'Your session has expired. Please log in again.';
  }

  if (error.message.includes('forbidden') || error.message.includes('403')) {
    return 'You don\'t have permission to access this resource.';
  }

  if (error.message.includes('not found') || error.message.includes('404')) {
    return 'The requested resource could not be found.';
  }

  if (error.message.includes('rate limit') || error.message.includes('429')) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  if (error.message.includes('server') || error.message.includes('500')) {
    return 'Our servers are experiencing issues. Please try again later.';
  }

  // Default message
  return 'Something unexpected happened. Please try again or contact support if the problem continues.';
}