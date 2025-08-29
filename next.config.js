/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations - disable standalone for Vercel
  // output: 'standalone',
  compress: true,
  poweredByHeader: false,
  
  // External packages configuration
  serverExternalPackages: ['bcryptjs', '@supabase/supabase-js', 'web-push'],
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data:",
              "font-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
            ].join('; ')
          }
        ]
      }
    ]
  },

  // Rewrites for API routes and static files
  async rewrites() {
    return [
      {
        source: '/health',
        destination: '/api/health'
      }
    ]
  },

  // Image optimization
  images: {
    domains: ['fisherbackflows.com', 'supabase.co'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 3600,
  },
  
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },

  // Minimal experimental features for Vercel compatibility
  experimental: {
    scrollRestoration: true,
  },
  
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },

    resolveAlias: {
      '@': './src',
    }
  },

  // Simplified webpack config for Vercel compatibility
  webpack: (config) => {
    return config
  },
}

module.exports = nextConfig