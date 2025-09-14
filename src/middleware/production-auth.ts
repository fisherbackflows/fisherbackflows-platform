import { NextRequest, NextResponse } from 'next/server';
import { validateSession, logSecurityEvent, isRateLimited } from '@/lib/auth-security';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/team-portal',
  '/api/team',
  '/admin',
  '/api/admin',
  '/field',
  '/api/field'
  // Customer portal routes removed - they use Supabase auth, not team sessions
];

// Routes that should remain public (no authentication required)
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/maintenance',
  '/test-navigation',
  '/portal', // Customer portal login page
  '/portal/login',
  '/portal/register',
  '/portal/forgot-password',
  '/portal/verification-success',
  '/portal/verification-error',
  '/api/auth',
  '/api/register'
];

// Routes that should redirect if already authenticated
const AUTH_ROUTES = [
  '/team-portal/login',
  '/field/login'
];

// Rate-limited routes (higher security)
const RATE_LIMITED_ROUTES = [
  '/api/team/auth/login',
  '/api/field/auth/login',
  '/api/auth/login',
  '/api/auth/register'
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => 
    pathname === route || (route !== '/' && pathname.startsWith(route))
  );
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname.startsWith(route));
}

function isRateLimitedRoute(pathname: string): boolean {
  return RATE_LIMITED_ROUTES.some(route => pathname.startsWith(route));
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (real) {
    return real;
  }
  return request.ip || 'unknown';
}

export async function productionAuthMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Debug logging
  console.log(`🔐 Auth middleware: ${pathname} - Protected: ${isProtectedRoute(pathname)} - Public: ${isPublicRoute(pathname)}`);
  
  // Apply rate limiting to sensitive routes
  if (isRateLimitedRoute(pathname)) {
    const rateLimitResult = isRateLimited(clientIP);
    
    if (rateLimitResult.isLimited) {
      await logSecurityEvent({
        eventType: 'suspicious_activity',
        ipAddress: clientIP,
        userAgent,
        success: false,
        metadata: {
          reason: 'rate_limited',
          path: pathname,
          retryAfter: rateLimitResult.retryAfter
        }
      });
      
      return NextResponse.json(
        { 
          error: 'Too many requests',
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '300',
            'X-Rate-Limit-Limit': '5',
            'X-Rate-Limit-Window': '300'
          }
        }
      );
    }
  }
  
  // Get session token from cookie
  const sessionToken = request.cookies.get('team_session')?.value;
  
  // Handle authentication routes
  if (isAuthRoute(pathname)) {
    if (sessionToken) {
      const { isValid } = await validateSession(sessionToken);
      if (isValid) {
        // User is already authenticated, redirect to dashboard
        return NextResponse.redirect(new URL('/team-portal/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }
  
  // Allow public routes through without authentication
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }
  
  // Handle protected routes
  if (isProtectedRoute(pathname)) {
    if (!sessionToken) {
      await logSecurityEvent({
        eventType: 'suspicious_activity',
        ipAddress: clientIP,
        userAgent,
        success: false,
        metadata: {
          reason: 'no_session_token',
          attempted_path: pathname
        }
      });
      
      // Redirect to login with return URL
      const loginUrl = new URL('/team-portal/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    const sessionValidation = await validateSession(sessionToken);
    
    if (!sessionValidation.isValid) {
      await logSecurityEvent({
        eventType: 'suspicious_activity',
        ipAddress: clientIP,
        userAgent,
        success: false,
        metadata: {
          reason: 'invalid_session',
          attempted_path: pathname,
          error: sessionValidation.error
        }
      });
      
      // Clear invalid session cookie
      const response = NextResponse.redirect(new URL('/team-portal/login', request.url));
      response.cookies.delete('team_session');
      return response;
    }
    
    // Check role-based access for admin routes
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      if (sessionValidation.user?.role !== 'admin') {
        await logSecurityEvent({
          eventType: 'suspicious_activity',
          ipAddress: clientIP,
          userEmail: sessionValidation.user?.email,
          userAgent,
          success: false,
          metadata: {
            reason: 'insufficient_permissions',
            attempted_path: pathname,
            user_role: sessionValidation.user?.role
          }
        });
        
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }
    
    // Add user info to request headers for downstream use
    const response = NextResponse.next();
    if (sessionValidation.user) {
      response.headers.set('X-User-ID', sessionValidation.user.id);
      response.headers.set('X-User-Email', sessionValidation.user.email);
      response.headers.set('X-User-Role', sessionValidation.user.role);
    }
    
    return response;
  }
  
  return NextResponse.next();
}

// Security headers for all responses
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent XSS attacks
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // HTTPS and transport security
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  return response;
}