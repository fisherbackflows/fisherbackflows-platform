import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/icon.png') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Handle legacy redirects to unified auth
  if (pathname === '/portal/login' || pathname === '/team-portal/login' || pathname === '/field/login') {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (pathname === '/portal/register' || pathname === '/team-portal/register') {
    return NextResponse.redirect(new URL('/auth/register', request.url));
  }

  // Handle specific redirects (matching vercel.json)
  if (pathname === '/app') {
    return NextResponse.redirect(new URL('/business', request.url));
  }

  // Initialize response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Get auth token from cookies
  const authToken = request.cookies.get('auth_token')?.value;

  // Helper function to check authentication and get user info
  const getUserFromToken = () => {
    if (!authToken) return null;

    try {
      const decoded = jwt.verify(authToken, JWT_SECRET) as any;
      return decoded;
    } catch {
      return null;
    }
  };

  // Protected route patterns and required roles
  const protectedRoutes = [
    { pattern: /^\/portal\//, allowedRoles: ['customer'], excludePaths: ['/portal/directory'] },
    { pattern: /^\/business\//, allowedRoles: ['business_owner', 'business_admin'] },
    { pattern: /^\/field\//, allowedRoles: ['field_tech'] },
    { pattern: /^\/admin\//, allowedRoles: ['admin'] },
    { pattern: /^\/team-portal\//, allowedRoles: ['business_owner', 'business_admin'] }
  ];

  // Check if current path requires authentication
  const matchedRoute = protectedRoutes.find(route => route.pattern.test(pathname));

  if (matchedRoute) {
    // Check if path should be excluded from auth
    const isExcluded = matchedRoute.excludePaths?.some(excludePath => pathname.startsWith(excludePath));

    if (!isExcluded) {
      const user = getUserFromToken();

      if (!user) {
        // Not authenticated, redirect to unified login
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('returnTo', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Check if user has required role
      if (!matchedRoute.allowedRoles.includes(user.role)) {
        // User doesn't have permission, redirect to their default portal
        const redirectPath = getDefaultRedirectForRole(user.role);
        return NextResponse.redirect(new URL(redirectPath, request.url));
      }
    }
  }

  return response;
}

// Helper function to get default redirect based on role
function getDefaultRedirectForRole(role: string): string {
  switch (role) {
    case 'customer':
      return '/portal/dashboard';
    case 'business_owner':
    case 'business_admin':
      return '/business/dashboard';
    case 'field_tech':
      return '/field/dashboard';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/auth/login';
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Any file with extension (images, css, js, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\..*).*)',
  ],
};