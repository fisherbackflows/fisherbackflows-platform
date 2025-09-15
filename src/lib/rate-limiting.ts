import { NextRequest } from 'next/server';

// Simple in-memory rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { attempts: number; lastAttempt: number; blockUntil?: number }>();

export const RATE_LIMIT_CONFIGS = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
  },
  register: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 60 * 60 * 1000, // 1 hour
  },
  passwordReset: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 60 * 60 * 1000, // 1 hour
  }
} as const;

export function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }

  // Fallback to connection IP
  return request.ip || 'unknown';
}

export function checkRateLimit(
  clientId: string,
  action: keyof typeof RATE_LIMIT_CONFIGS
): { allowed: boolean; remainingAttempts: number; resetTime: number; blockedUntil?: number } {
  const config = RATE_LIMIT_CONFIGS[action];
  const now = Date.now();
  const key = `${action}:${clientId}`;

  let record = rateLimitStore.get(key);

  // Clean up old records
  if (record && now - record.lastAttempt > config.windowMs && (!record.blockUntil || now > record.blockUntil)) {
    record = undefined;
    rateLimitStore.delete(key);
  }

  // Check if currently blocked
  if (record?.blockUntil && now < record.blockUntil) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: record.blockUntil,
      blockedUntil: record.blockUntil
    };
  }

  // Initialize or reset if window expired
  if (!record) {
    record = { attempts: 0, lastAttempt: now };
    rateLimitStore.set(key, record);
  }

  const remainingAttempts = Math.max(0, config.maxAttempts - record.attempts);

  if (remainingAttempts <= 0) {
    // Block the client
    record.blockUntil = now + config.blockDurationMs;
    rateLimitStore.set(key, record);

    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: record.blockUntil,
      blockedUntil: record.blockUntil
    };
  }

  return {
    allowed: true,
    remainingAttempts,
    resetTime: now + config.windowMs
  };
}

export function recordAttempt(
  clientId: string,
  action: keyof typeof RATE_LIMIT_CONFIGS,
  success: boolean = false
): void {
  const key = `${action}:${clientId}`;
  const now = Date.now();

  let record = rateLimitStore.get(key);

  if (!record) {
    record = { attempts: 0, lastAttempt: now };
  }

  // If successful login, reset attempts
  if (success && action === 'login') {
    rateLimitStore.delete(key);
    return;
  }

  // Increment attempts for failed attempts
  record.attempts++;
  record.lastAttempt = now;

  rateLimitStore.set(key, record);
}

// Clean up old entries periodically (simple cleanup)
setInterval(() => {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour

  for (const [key, record] of rateLimitStore.entries()) {
    if (now - record.lastAttempt > maxAge && (!record.blockUntil || now > record.blockUntil)) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000); // Clean every 10 minutes

export function getRateLimitHeaders(
  remainingAttempts: number,
  resetTime: number,
  blockedUntil?: number
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': remainingAttempts.toString(),
    'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString()
  };

  if (blockedUntil) {
    headers['Retry-After'] = Math.ceil((blockedUntil - Date.now()) / 1000).toString();
  }

  return headers;
}