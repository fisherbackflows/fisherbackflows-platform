import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force middleware to use Node.js runtime instead of Edge Runtime
export const runtime = 'nodejs'

// Initialize Supabase client for middleware
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''
  const path = url.pathname

  // Skip middleware for API routes, static files, and internal routes
  if (
    path.startsWith('/api/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/favicon.ico') ||
    path.startsWith('/sitemap.xml') ||
    path.startsWith('/robots.txt') ||
    path.startsWith('/sw.js') ||
    path.startsWith('/manifest.json') ||
    path.includes('.')
  ) {
    return NextResponse.next()
  }

  // Extract subdomain
  const subdomain = getSubdomain(hostname)
  
  // Skip for main domains and localhost
  if (!subdomain || isMainDomain(hostname)) {
    return NextResponse.next()
  }

  try {
    // Check if subdomain corresponds to a company
    const { data: company, error } = await supabase
      .from('companies')
      .select('id, slug, name, subscription_status')
      .eq('slug', subdomain)
      .single()

    if (error || !company) {
      // Subdomain doesn't exist, redirect to main site
      return NextResponse.redirect(new URL(`https://fisherbackflows.com${path}`, request.url))
    }

    // Check if company subscription is active
    if (!['active', 'trialing'].includes(company.subscription_status)) {
      // Inactive subscription, redirect to billing
      return NextResponse.redirect(new URL('https://fisherbackflows.com/billing-required', request.url))
    }

    // Handle portal routes for company subdomains
    if (path === '/' || path.startsWith('/portal')) {
      // Rewrite to company-specific portal route
      const rewriteUrl = new URL(`/portal/company/${subdomain}${path === '/' ? '' : path}`, request.url)
      rewriteUrl.hostname = getMainDomain(hostname)
      
      // Add company context to headers
      const response = NextResponse.rewrite(rewriteUrl)
      response.headers.set('x-company-slug', subdomain)
      response.headers.set('x-company-id', company.id)
      response.headers.set('x-company-name', company.name)
      
      return response
    }

    // Handle tester portal routes
    if (path.startsWith('/team')) {
      // Team routes should redirect to main domain
      return NextResponse.redirect(new URL(`https://fisherbackflows.com${path}`, request.url))
    }

    // Default: serve the portal login for company subdomain
    const rewriteUrl = new URL(`/portal/company/${subdomain}`, request.url)
    rewriteUrl.hostname = getMainDomain(hostname)
    
    const response = NextResponse.rewrite(rewriteUrl)
    response.headers.set('x-company-slug', subdomain)
    response.headers.set('x-company-id', company.id)
    response.headers.set('x-company-name', company.name)
    
    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, proceed normally
    return NextResponse.next()
  }
}

// Extract subdomain from hostname
function getSubdomain(hostname: string): string | null {
  // Handle localhost and IP addresses
  if (hostname.includes('localhost') || hostname.match(/^\d+\.\d+\.\d+\.\d+/)) {
    return null
  }

  // Handle Vercel preview domains
  if (hostname.includes('.vercel.app')) {
    const parts = hostname.split('.')
    if (parts.length > 3) {
      // Format: [subdomain]-[project]-[hash].vercel.app
      return parts[0].split('-')[0]
    }
    return null
  }

  // Handle production domains
  const parts = hostname.split('.')
  
  // For fisherbackflows.com, extract subdomain
  if (parts.length >= 3 && hostname.includes('fisherbackflows.com')) {
    return parts[0]
  }
  
  // For custom domains, treat the whole domain as a company identifier
  if (parts.length >= 2 && !hostname.includes('fisherbackflows.com')) {
    return hostname.replace(/\./g, '-')
  }
  
  return null
}

// Check if hostname is a main domain
function isMainDomain(hostname: string): boolean {
  const mainDomains = [
    'fisherbackflows.com',
    'www.fisherbackflows.com',
    'app.fisherbackflows.com',
    'localhost',
    'localhost:3000',
    'localhost:3010'
  ]
  
  return mainDomains.includes(hostname) || 
         hostname.endsWith('.vercel.app') && !hostname.includes('-') ||
         hostname.match(/^\d+\.\d+\.\d+\.\d+/)
}

// Get main domain from current hostname
function getMainDomain(hostname: string): string {
  if (hostname.includes('localhost')) {
    return 'localhost:3010'
  }
  
  if (hostname.includes('vercel.app')) {
    // Extract base vercel domain
    const parts = hostname.split('.')
    if (parts.length >= 3) {
      return parts.slice(-3).join('.')
    }
  }
  
  return 'fisherbackflows.com'
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Any file with extension
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}