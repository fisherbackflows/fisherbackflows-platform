import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Check for simple private mode cookie
  const isPrivateMode = request.cookies.get('site-private-mode')?.value === 'true';
  
  // Admin routes that should always be accessible
  const adminRoutes = [
    '/team-portal',
    '/api/team',
    '/api/admin',
    '/app' // Legacy admin routes
  ];
  
  // Check if this is an admin route
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  
  // If in private mode and not an admin route, check for admin session
  if (isPrivateMode && !isAdminRoute) {
    // Allow access to maintenance page itself
    if (pathname === '/maintenance') {
      return NextResponse.next();
    }
    
    // Check for admin bypass cookie or session
    const adminBypass = request.cookies.get('admin-bypass')?.value;
    const teamSession = request.cookies.get('team_session')?.value;
    
    // If no admin access, redirect to maintenance page
    if (!adminBypass && !teamSession) {
      url.pathname = '/maintenance';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.png).*)',
  ],
};