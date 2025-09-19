/**
 * Minimalist Monitoring & Error Handling - Fisher Backflows
 * Simple, effective monitoring without bloat
 */

// Error types
export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'UNKNOWN_ERROR',
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Simple logger
export const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, data || '');
    }
  },
  
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '');
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
      // Send to Sentry or similar
    }
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '');
  }
};

// Performance monitoring
export function measure(name: string, fn: () => any) {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  if (duration > 1000) {
    logger.warn(`Slow operation: ${name} took ${duration}ms`);
  }
  
  return result;
}

// API response helpers
export const response = {
  success: (data: any, message?: string) => ({
    success: true,
    message,
    data
  }),
  
  error: (error: string | Error, statusCode = 500) => {
    const message = error instanceof Error ? error.message : error;
    logger.error('API Error', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: message
      }),
      {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// Rate limiting helper
const rateLimitMap = new Map<string, number[]>();

export function rateLimit(key: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(key) || [];
  
  // Clean old requests
  const validRequests = requests.filter(time => now - time < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  validRequests.push(now);
  rateLimitMap.set(key, validRequests);
  return true;
}