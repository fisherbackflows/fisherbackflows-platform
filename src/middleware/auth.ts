import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function authMiddleware(request: NextRequest) {
  // Skip auth middleware if Supabase not configured
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️  Supabase not configured - skipping auth middleware')
    return NextResponse.next()
  }

  const response = NextResponse.next()
  
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Get user session
  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Define protected routes
  const customerRoutes = ['/portal/dashboard', '/portal/schedule', '/portal/billing', '/portal/reports', '/portal/devices']
  const fieldRoutes = ['/field/dashboard', '/field/test']
  const publicRoutes = ['/login', '/field/login', '/', '/portal']

  // Check if route is protected
  const isCustomerRoute = customerRoutes.some(route => pathname.startsWith(route))
  const isFieldRoute = fieldRoutes.some(route => pathname.startsWith(route))
  // const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route))

  // Handle customer portal routes
  if (isCustomerRoute) {
    if (!user) {
      // Redirect to customer login
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Check if user has customer profile
    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single()

      if (!customer && !user.user_metadata?.customer_id) {
        // User exists but no customer profile - redirect to register
        return NextResponse.redirect(new URL('/login?error=no-customer-profile', request.url))
      }
    } catch (error) {
      console.error('Error checking customer profile:', error)
      // Allow access in case of database error
    }
  }

  // Handle field app routes  
  if (isFieldRoute) {
    // For field routes, check localStorage-based tech auth on client side
    // Server-side middleware can't access localStorage, so we'll handle this client-side
    // This is a simplification for demo purposes
  }

  return response
}

export const config = {
  matcher: [
    '/portal/:path*',
    '/field/:path*',
    '/login',
    '/field/login'
  ]
}