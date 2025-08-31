import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

// Production security configuration
export const SECURITY_CONFIG = {
  // Authentication
  maxFailedAttempts: 3,
  accountLockoutMs: 15 * 60 * 1000, // 15 minutes
  sessionDurationMs: 4 * 60 * 60 * 1000, // 4 hours
  passwordMinLength: 12,
  passwordMaxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
  
  // Rate limiting
  rateLimitWindowMs: 5 * 60 * 1000, // 5 minutes
  maxRequestsPerWindow: 5,
  
  // Session security
  sessionTokenLength: 32,
  sessionCleanupInterval: 60 * 60 * 1000, // 1 hour
  
  // Password requirements
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecial: true,
  passwordMinUniqueChars: 8,
} as const;

// Secure random token generation
export function generateSecureToken(length: number = SECURITY_CONFIG.sessionTokenLength): string {
  return crypto.randomBytes(length).toString('hex');
}

// Generate cryptographically secure UUID
export function generateSecureUUID(): string {
  return crypto.randomUUID();
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  score: number; // 0-100
} {
  const errors: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length < SECURITY_CONFIG.passwordMinLength) {
    errors.push(`Password must be at least ${SECURITY_CONFIG.passwordMinLength} characters long`);
  } else {
    score += Math.min(25, password.length * 2);
  }
  
  // Character variety checks
  if (SECURITY_CONFIG.passwordRequireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    score += 15;
  }
  
  if (SECURITY_CONFIG.passwordRequireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (/[a-z]/.test(password)) {
    score += 15;
  }
  
  if (SECURITY_CONFIG.passwordRequireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (/[0-9]/.test(password)) {
    score += 15;
  }
  
  if (SECURITY_CONFIG.passwordRequireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 15;
  }
  
  // Unique character count
  const uniqueChars = new Set(password).size;
  if (uniqueChars < SECURITY_CONFIG.passwordMinUniqueChars) {
    errors.push(`Password must contain at least ${SECURITY_CONFIG.passwordMinUniqueChars} unique characters`);
  } else {
    score += Math.min(15, uniqueChars);
  }
  
  // Common patterns check
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password should not contain repeated characters');
    score -= 10;
  }
  
  if (/123|abc|qwe|asd|zxc/i.test(password)) {
    errors.push('Password should not contain common patterns');
    score -= 15;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    score: Math.max(0, Math.min(100, score))
  };
}

// Secure session validation
export async function validateSession(sessionToken: string): Promise<{
  isValid: boolean;
  user?: any;
  session?: any;
  error?: string;
}> {
  if (!sessionToken) {
    return { isValid: false, error: 'No session token provided' };
  }
  
  try {
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('team_sessions')
      .select(`
        id,
        team_user_id,
        session_token,
        ip_address,
        user_agent,
        expires_at,
        is_active,
        last_activity,
        team_users (
          id,
          email,
          role,
          first_name,
          last_name,
          is_active,
          failed_login_attempts,
          account_locked_until,
          last_login
        )
      `)
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single();
    
    if (sessionError || !session) {
      return { isValid: false, error: 'Invalid session token' };
    }
    
    // Check if session has expired
    if (new Date(session.expires_at) < new Date()) {
      // Mark session as inactive
      await supabaseAdmin
        .from('team_sessions')
        .update({ is_active: false })
        .eq('id', session.id);
      
      return { isValid: false, error: 'Session expired' };
    }
    
    const user = session.team_users;
    
    // Check if user is still active
    if (!user?.is_active) {
      return { isValid: false, error: 'User account is disabled' };
    }
    
    // Check if user account is locked
    if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
      return { isValid: false, error: 'User account is locked' };
    }
    
    // Update last activity
    await supabaseAdmin
      .from('team_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', session.id);
    
    return {
      isValid: true,
      user,
      session: {
        id: session.id,
        expires_at: session.expires_at,
        last_activity: session.last_activity
      }
    };
    
  } catch (error) {
    console.error('Session validation error:', error);
    return { isValid: false, error: 'Session validation failed' };
  }
}

// Clean up expired sessions
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const { error } = await supabaseAdmin
      .rpc('cleanup_expired_sessions');
    
    if (error) {
      console.error('Session cleanup error:', error);
      return 0;
    }
    
    return 1; // Success
  } catch (error) {
    console.error('Session cleanup failed:', error);
    return 0;
  }
}

// Security logging
export interface SecurityEvent {
  eventType: 'login_attempt' | 'login_success' | 'login_failure' | 'logout' | 'session_expired' | 'account_locked' | 'password_change' | 'suspicious_activity';
  ipAddress: string;
  userEmail?: string;
  userAgent: string;
  success: boolean;
  metadata?: Record<string, any>;
}

export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    await supabaseAdmin.from('security_logs').insert({
      event_type: event.eventType,
      ip_address: event.ipAddress,
      user_email: event.userEmail,
      user_agent: event.userAgent,
      success: event.success,
      timestamp: new Date().toISOString(),
      metadata: event.metadata || {}
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
    // Don't throw - logging should never break the main flow
  }
}

// IP-based rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, {
  attempts: number;
  firstAttempt: number;
  blockedUntil?: number;
}>();

export function isRateLimited(ipAddress: string): {
  isLimited: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  const record = rateLimitStore.get(ipAddress);
  
  if (!record) {
    rateLimitStore.set(ipAddress, {
      attempts: 1,
      firstAttempt: now
    });
    return { isLimited: false };
  }
  
  // Check if currently blocked
  if (record.blockedUntil && now < record.blockedUntil) {
    return {
      isLimited: true,
      retryAfter: Math.ceil((record.blockedUntil - now) / 1000)
    };
  }
  
  // Reset if window expired
  if (now - record.firstAttempt > SECURITY_CONFIG.rateLimitWindowMs) {
    rateLimitStore.set(ipAddress, {
      attempts: 1,
      firstAttempt: now
    });
    return { isLimited: false };
  }
  
  // Check if limit exceeded
  if (record.attempts >= SECURITY_CONFIG.maxRequestsPerWindow) {
    record.blockedUntil = now + SECURITY_CONFIG.accountLockoutMs;
    return {
      isLimited: true,
      retryAfter: Math.ceil(SECURITY_CONFIG.accountLockoutMs / 1000)
    };
  }
  
  record.attempts++;
  return { isLimited: false };
}

// Sanitize and validate input
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim().replace(/[^\w@.-]/g, '');
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Constant-time string comparison to prevent timing attacks
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}