import { NextRequest, NextResponse } from 'next/server';
import { productionAuthMiddleware, addSecurityHeaders } from '@/middleware/production-auth';

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
  
  // Handle specific redirects (matching vercel.json)
  if (pathname === '/app') {
    return NextResponse.redirect(new URL('/team-portal', request.url));
  }
  
  // Apply production authentication middleware
  let response = await productionAuthMiddleware(request);
  
  // If auth middleware returned a response (redirect, error, etc.), use it
  if (response.status !== 200 || response.redirected) {
    return addSecurityHeaders(response);
  }
  
  // Check if site is in private mode (legacy support)
  const isPrivateMode = request.cookies.get('site-private-mode')?.value === 'true';
  const hasAdminAccess = request.cookies.get('team_session')?.value || 
                         request.cookies.get('admin-bypass')?.value;

  // If private mode is enabled and user doesn't have admin access
  if (isPrivateMode && !hasAdminAccess) {
    // Only affect public pages, not API routes or team portal
    if (!pathname.startsWith('/api/') && !pathname.startsWith('/team-portal')) {
      const url = request.nextUrl.clone();
      url.pathname = '/team-portal/login';
      response = NextResponse.redirect(url);
    }
  }
  
  // Add security headers to all responses
  return addSecurityHeaders(response);
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