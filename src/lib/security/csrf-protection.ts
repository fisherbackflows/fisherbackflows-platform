/**
 * CSRF Protection Implementation
 * Prevents Cross-Site Request Forgery attacks
 */

import crypto from 'crypto';
import { NextRequest } from 'next/server';

// Store CSRF tokens (in production, use Redis or database)
const csrfTokenStore = new Map<string, { token: string; expires: number }>();

// Token configuration
const TOKEN_LENGTH = 32;
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(TOKEN_LENGTH).toString('hex');
  const expires = Date.now() + TOKEN_EXPIRY_MS;

  csrfTokenStore.set(sessionId, { token, expires });

  return token;
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokenStore.get(sessionId);

  if (!stored) {
    return false;
  }

  // Check if token expired
  if (stored.expires < Date.now()) {
    csrfTokenStore.delete(sessionId);
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(stored.token),
    Buffer.from(token)
  );
}

/**
 * Clean expired tokens (run periodically)
 */
export function cleanExpiredTokens(): void {
  const now = Date.now();

  for (const [sessionId, data] of csrfTokenStore.entries()) {
    if (data.expires < now) {
      csrfTokenStore.delete(sessionId);
    }
  }
}

/**
 * Extract CSRF token from request
 */
export function extractCSRFToken(request: NextRequest): string | null {
  // Check header first (for AJAX requests)
  const headerToken = request.headers.get('X-CSRF-Token');
  if (headerToken) return headerToken;

  // Check body for form submissions
  // Note: This requires parsing the body which should be done carefully
  // to avoid consuming the stream
  return null;
}

/**
 * Middleware to validate CSRF token
 */
export async function validateCSRF(
  request: NextRequest,
  sessionId: string
): Promise<{ valid: boolean; error?: string }> {
  // Skip CSRF check for safe methods
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { valid: true };
  }

  // Skip for API endpoints that use different auth (like Stripe webhooks)
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/webhooks/')) {
    return { valid: true };
  }

  // Extract token from request
  const token = extractCSRFToken(request);

  if (!token) {
    return { valid: false, error: 'CSRF token missing' };
  }

  // Verify token
  if (!verifyCSRFToken(sessionId, token)) {
    return { valid: false, error: 'Invalid CSRF token' };
  }

  return { valid: true };
}

/**
 * Get or create CSRF token for session
 */
export function getCSRFToken(sessionId: string): string {
  const stored = csrfTokenStore.get(sessionId);

  if (stored && stored.expires > Date.now()) {
    return stored.token;
  }

  return generateCSRFToken(sessionId);
}

// Clean up expired tokens every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanExpiredTokens, 5 * 60 * 1000);
}

export default {
  generate: generateCSRFToken,
  verify: verifyCSRFToken,
  validate: validateCSRF,
  get: getCSRFToken,
  extract: extractCSRFToken
};