import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
import bcrypt from 'bcryptjs';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { headers } from 'next/headers';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { attempts: number; lastAttempt: number; blockedUntil?: number }>();

// Security configuration
const SECURITY_CONFIG = {
  maxFailedAttempts: 3,
  lockoutDurationMs: 15 * 60 * 1000, // 15 minutes
  rateLimitWindowMs: 5 * 60 * 1000,   // 5 minutes
  maxRequestsPerWindow: 5,
  sessionDurationMs: 4 * 60 * 60 * 1000, // 4 hours (reduced from 8)
  passwordMinLength: 12,
  requireMFA: false // Set to true for multi-factor auth
};

interface LoginAttempt {
  ip: string;
  email: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
}

// Secure session token generation
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Get client IP address
async function getClientIP(request: NextRequest): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get('x-forwarded-for');
  const real = headersList.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (real) {
    return real;
  }
  return request.ip || 'unknown';
}

// Rate limiting check
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record) {
    rateLimitStore.set(ip, { attempts: 1, lastAttempt: now });
    return false;
  }
  
  // Check if blocked
  if (record.blockedUntil && now < record.blockedUntil) {
    return true;
  }
  
  // Reset if window expired
  if (now - record.lastAttempt > SECURITY_CONFIG.rateLimitWindowMs) {
    rateLimitStore.set(ip, { attempts: 1, lastAttempt: now });
    return false;
  }
  
  // Check rate limit
  if (record.attempts >= SECURITY_CONFIG.maxRequestsPerWindow) {
    record.blockedUntil = now + SECURITY_CONFIG.lockoutDurationMs;
    return true;
  }
  
  record.attempts++;
  record.lastAttempt = now;
  return false;
}

// Log security events
async function logSecurityEvent(event: LoginAttempt) {
  try {
    const dbClient = supabaseAdmin || supabase;
    if (dbClient) {
      await dbClient.from('security_logs').insert({
        event_type: 'login_attempt',
        ip_address: event.ip,
        user_email: event.email,
        user_agent: event.userAgent,
        success: event.success,
        timestamp: event.timestamp,
        metadata: {
          rate_limited: false,
          failed_attempts: 0
        }
      });
    }
  } catch (error) {
    // Silent fail for security event logging to avoid exposing errors
    // In production, this should be logged to a proper logging service
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = await getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  try {
    // Rate limiting
    if (isRateLimited(clientIP)) {
      await logSecurityEvent({
        ip: clientIP,
        email: 'unknown',
        userAgent,
        timestamp: new Date().toISOString(),
        success: false
      });
      
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil(SECURITY_CONFIG.lockoutDurationMs / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(SECURITY_CONFIG.lockoutDurationMs / 1000).toString(),
            'X-Rate-Limit-Limit': SECURITY_CONFIG.maxRequestsPerWindow.toString(),
            'X-Rate-Limit-Window': Math.ceil(SECURITY_CONFIG.rateLimitWindowMs / 1000).toString()
          }
        }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    // Input validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input format' },
        { status: 400 }
      );
    }

    if (password.length < SECURITY_CONFIG.passwordMinLength) {
      return NextResponse.json(
        { error: 'Invalid credentials' }, // Don't reveal password requirements
        { status: 401 }
      );
    }

    // Sanitize email
    const sanitizedEmail = email.toLowerCase().trim();
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Database connection
    const dbClient = supabaseAdmin || supabase;
    if (!dbClient) {
      // Log to proper service in production - avoid console.error
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Get user from team_users table with security fields
    const { data: user, error: userError } = await dbClient
      .from('team_users')
      .select('id, email, password_hash, role, first_name, last_name, is_active, failed_login_attempts, last_failed_login, account_locked_until, last_login, created_at, updated_at')
      .eq('email', sanitizedEmail)
      .single();

    const loginEvent: LoginAttempt = {
      ip: clientIP,
      email: sanitizedEmail,
      userAgent,
      timestamp: new Date().toISOString(),
      success: false
    };

    if (userError || !user) {
      // Simulate password check timing to prevent user enumeration
      await bcrypt.compare(password, '$2b$12$dummy.hash.to.prevent.timing.attacks.dummy.hash.value.here');
      
      await logSecurityEvent(loginEvent);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.is_active) {
      await logSecurityEvent(loginEvent);
      return NextResponse.json(
        { error: 'Account is disabled' },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
      await logSecurityEvent(loginEvent);
      return NextResponse.json(
        { error: 'Account is temporarily locked. Please contact administrator.' },
        { status: 401 }
      );
    }

    // Check failed attempts
    if (user.failed_login_attempts >= SECURITY_CONFIG.maxFailedAttempts) {
      const lockUntil = new Date(Date.now() + SECURITY_CONFIG.lockoutDurationMs);
      
      // Lock the account
      await dbClient
        .from('team_users')
        .update({ 
          account_locked_until: lockUntil.toISOString(),
          last_failed_login: new Date().toISOString()
        })
        .eq('id', user.id);

      await logSecurityEvent(loginEvent);
      return NextResponse.json(
        { error: 'Account locked due to multiple failed attempts' },
        { status: 401 }
      );
    }

    // Verify password using constant-time comparison
    if (!user.password_hash) {
      await logSecurityEvent(loginEvent);
      return NextResponse.json(
        { error: 'Account not properly configured. Please contact administrator.' },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      // Increment failed attempts
      const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
      
      await dbClient
        .from('team_users')
        .update({ 
          failed_login_attempts: newFailedAttempts,
          last_failed_login: new Date().toISOString()
        })
        .eq('id', user.id);

      await logSecurityEvent(loginEvent);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Success - reset failed attempts and update login time
    await dbClient
      .from('team_users')
      .update({ 
        failed_login_attempts: 0,
        last_failed_login: null,
        account_locked_until: null,
        last_login: new Date().toISOString()
      })
      .eq('id', user.id);

    // Generate secure session
    const sessionToken = generateSecureToken();
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SECURITY_CONFIG.sessionDurationMs);

    // Store session in database
    const { error: sessionError } = await dbClient
      .from('team_sessions')
      .insert({
        id: sessionId,
        team_user_id: user.id,
        session_token: sessionToken,
        ip_address: clientIP,
        user_agent: userAgent,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });

    if (sessionError) {
      // Log to proper service in production - avoid console.error
      return NextResponse.json(
        { error: 'Failed to create secure session' },
        { status: 500 }
      );
    }

    // Set secure cookie with additional security flags
    const cookieStore = await cookies();
    cookieStore.set('team_session', sessionToken, {
      httpOnly: true,
      secure: true, // Always require HTTPS in production
      sameSite: 'strict', // Stronger CSRF protection
      maxAge: Math.floor(SECURITY_CONFIG.sessionDurationMs / 1000),
      path: '/',
      // Additional security attributes
      ...(process.env.NODE_ENV === 'production' && {
        domain: '.fisherbackflows.com'
      })
    });

    // Log successful login
    loginEvent.success = true;
    await logSecurityEvent(loginEvent);

    // Return user data (excluding sensitive fields)
    const { password_hash, failed_login_attempts, account_locked_until, last_failed_login, ...safeUserData } = user;
    
    const response = NextResponse.json({
      user: safeUserData,
      role: user.role,
      sessionExpires: expiresAt.toISOString()
    });

    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    return response;

  } catch (error) {
    // Log to proper service in production - avoid console.error

    // Log error event
    await logSecurityEvent({
      ip: clientIP,
      email: 'unknown',
      userAgent,
      timestamp: new Date().toISOString(),
      success: false
    });

    return NextResponse.json(
      { error: 'Authentication service error' },
      {
        status: 500,
        headers: {
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  }
}