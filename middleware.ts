import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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

  // Initialize response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Authentication checks for protected routes
  if (pathname.startsWith('/portal/') &&
      !pathname.startsWith('/portal/login') &&
      !pathname.startsWith('/portal/register') &&
      !pathname.startsWith('/portal/forgot-password') &&
      !pathname.startsWith('/portal/reset-password') &&
      !pathname.startsWith('/portal/verify') &&
      !pathname.startsWith('/portal/directory') &&
      pathname !== '/portal') {

    try {
      // Create Supabase client for server-side auth check
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value;
            },
            set(name: string, value: string, options: any) {
              response.cookies.set(name, value, options);
            },
            remove(name: string, options: any) {
              response.cookies.set(name, '', { ...options, maxAge: 0 });
            },
          },
        }
      );

      // Check if user is authenticated
      const { data: { user }, error } = await supabase.auth.getUser();

      if (!user || error) {
        // Not authenticated, redirect to login
        const loginUrl = new URL('/portal/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // User is authenticated, check if they have a customer record
      const { data: customer } = await supabase
        .from('customers')
        .select('id, account_status')
        .eq('auth_user_id', user.id)
        .single();

      if (!customer) {
        // User exists but no customer record, redirect to registration
        return NextResponse.redirect(new URL('/portal/register', request.url));
      }

      if (customer.account_status !== 'active') {
        // Account is not active, redirect to verification
        return NextResponse.redirect(new URL('/portal/verify', request.url));
      }

    } catch (error) {
      // Log error only in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Middleware auth error:', error);
      }
      // On error, redirect to login for security
      return NextResponse.redirect(new URL('/portal/login', request.url));
    }
  }

  // Team portal authentication
  if (pathname.startsWith('/team-portal/') &&
      !pathname.startsWith('/team-portal/login') &&
      !pathname.startsWith('/team-portal/register')) {

    const teamSession = request.cookies.get('team-session');

    if (!teamSession) {
      // Not authenticated, redirect to team login
      return NextResponse.redirect(new URL('/team-portal/login', request.url));
    }
  }

  // Admin portal authentication
  if (pathname.startsWith('/admin/')) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value;
            },
            set(name: string, value: string, options: any) {
              response.cookies.set(name, value, options);
            },
            remove(name: string, options: any) {
              response.cookies.set(name, '', { ...options, maxAge: 0 });
            },
          },
        }
      );

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.redirect(new URL('/portal/login', request.url));
      }

      // Check admin role
      const { data: customer } = await supabase
        .from('customers')
        .select('role')
        .eq('auth_user_id', user.id)
        .single();

      if (customer?.role !== 'admin') {
        return NextResponse.redirect(new URL('/portal/dashboard', request.url));
      }

    } catch (error) {
      return NextResponse.redirect(new URL('/portal/login', request.url));
    }
  }

  return response;
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