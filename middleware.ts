import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Always allow API routes, static files, and admin paths
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/team-portal') ||
    pathname === '/team-portal' ||
    pathname.startsWith('/api/admin/')
  ) {
    return NextResponse.next();
  }

  // Check if site is in private mode
  const isPrivateMode = request.cookies.get('site-private-mode')?.value === 'true';
  const hasAdminAccess = request.cookies.get('team_session')?.value || 
                         request.cookies.get('admin-bypass')?.value;

  // If private mode is enabled and user doesn't have admin access
  if (isPrivateMode && !hasAdminAccess) {
    // Redirect to team portal login
    const url = request.nextUrl.clone();
    url.pathname = '/team-portal';
    return NextResponse.redirect(url);
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