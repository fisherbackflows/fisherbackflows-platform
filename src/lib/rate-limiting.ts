// SECURITY: Rate limiting implementation for authentication endpoints

interface RateLimitStore {
  [key: string]: {
    attempts: number;
    resetTime: number;
    blocked: boolean;
  };
}

// In-memory store (in production, use Redis)
const rateLimitStore: RateLimitStore = {};

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

// Default rate limit configurations
export const RATE_LIMIT_CONFIGS = {
  AUTH_LOGIN: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
  },
  AUTH_REGISTER: {
    maxAttempts: 3,
    windowMs: 10 * 60 * 1000, // 10 minutes
    blockDurationMs: 60 * 60 * 1000, // 1 hour
  },
  PASSWORD_RESET: {
    maxAttempts: 3,
    windowMs: 5 * 60 * 1000, // 5 minutes
    blockDurationMs: 15 * 60 * 1000, // 15 minutes
  },
  ADMIN_BYPASS: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 24 * 60 * 60 * 1000, // 24 hours
  },
  AUTH_VERIFY: {
    maxAttempts: 5,
    windowMs: 10 * 60 * 1000, // 10 minutes
    blockDurationMs: 15 * 60 * 1000, // 15 minutes
  },
  SMS_RESEND: {
    maxAttempts: 3,
    windowMs: 10 * 60 * 1000, // 10 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
  },
} as const;

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const key = identifier;
  
  // Clean up expired entries
  if (rateLimitStore[key] && now > rateLimitStore[key].resetTime && !rateLimitStore[key].blocked) {
    delete rateLimitStore[key];
  }
  
  // Initialize if not exists
  if (!rateLimitStore[key]) {
    rateLimitStore[key] = {
      attempts: 0,
      resetTime: now + config.windowMs,
      blocked: false,
    };
  }
  
  const entry = rateLimitStore[key];
  
  // Check if still blocked
  if (entry.blocked && now < entry.resetTime) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }
  
  // Reset if block period expired
  if (entry.blocked && now >= entry.resetTime) {
    entry.attempts = 0;
    entry.blocked = false;
    entry.resetTime = now + config.windowMs;
  }
  
  // Check if within rate limit
  if (entry.attempts >= config.maxAttempts) {
    // Block the identifier
    entry.blocked = true;
    entry.resetTime = now + config.blockDurationMs;
    
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil(config.blockDurationMs / 1000),
    };
  }
  
  return {
    allowed: true,
    remainingAttempts: config.maxAttempts - entry.attempts,
    resetTime: entry.resetTime,
  };
}

export function recordAttempt(identifier: string, success: boolean, config: RateLimitConfig): void {
  const now = Date.now();
  const key = identifier;
  
  if (!rateLimitStore[key]) {
    rateLimitStore[key] = {
      attempts: 0,
      resetTime: now + config.windowMs,
      blocked: false,
    };
  }
  
  const entry = rateLimitStore[key];
  
  if (success) {
    // Reset on successful attempt
    delete rateLimitStore[key];
  } else {
    // Increment failed attempts
    entry.attempts++;
  }
}

export function getClientIdentifier(request: any): string {
  // Use IP address as primary identifier
  const forwarded = request.headers?.get?.('x-forwarded-for') || request.headers?.['x-forwarded-for'];
  const real = request.headers?.get?.('x-real-ip') || request.headers?.['x-real-ip'];
  const ip = request.ip || 'unknown';
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (real) {
    return real;
  }
  return ip;
}

export function clearRateLimit(identifier: string): void {
  delete rateLimitStore[identifier];
}

// Cleanup function to remove old entries
export function cleanupRateLimit(): void {
  const now = Date.now();
  
  Object.keys(rateLimitStore).forEach(key => {
    const entry = rateLimitStore[key];
    if (now > entry.resetTime && !entry.blocked) {
      delete rateLimitStore[key];
    }
  });
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimit, 5 * 60 * 1000);
}