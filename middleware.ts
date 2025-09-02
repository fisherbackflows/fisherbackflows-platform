import { NextRequest, NextResponse } from 'next/server';
import { productionAuthMiddleware, addSecurityHeaders } from '@/middleware/production-auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log(`🔍 Middleware triggered: ${pathname}`);
  
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
  
  // SECURITY: Re-enabled production authentication middleware
  console.log('🔐 Production auth middleware active');
  
  // Apply full authentication and security
  const authResponse = await productionAuthMiddleware(request);
  return addSecurityHeaders(authResponse);
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