import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Advanced bundle optimization
  experimental: {
    optimizePackageImports: [
      // UI Libraries
      '@heroicons/react',
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-label',
      '@radix-ui/react-slot',
      // Charts and data visualization
      'recharts',
      // Utilities
      'date-fns',
      'clsx',
      'class-variance-authority',
      'tailwind-merge',
    ],
    // Enable optimizeCss for better CSS bundling
    optimizeCss: true,
  },

  // Advanced webpack optimizations
  webpack: (config, { dev, isServer, webpack }) => {
    // Reduce build output verbosity
    config.stats = {
      preset: 'errors-warnings',
      assets: false,
      chunks: false,
      modules: false,
      chunkModules: false,
      entrypoints: false,
      chunkGroups: false,
      children: false,
      version: false,
      timings: false,
      hash: false,
      builtAt: false,
      warnings: false
    };

    // Production optimizations only
    if (!dev) {
      // Advanced chunk splitting strategy
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          // Framework chunk (React, Next.js core)
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          // Supabase and auth libs
          auth: {
            name: 'auth',
            test: /[\\/]node_modules[\\/](@supabase|supabase|jsonwebtoken|bcryptjs)[\\/]/,
            priority: 30,
            chunks: 'all',
          },
          // UI component libraries
          ui: {
            name: 'ui',
            test: /[\\/]node_modules[\\/](@radix-ui|@heroicons|lucide-react|class-variance-authority|clsx|tailwind-merge)[\\/]/,
            priority: 25,
            chunks: 'all',
          },
          // Charts and data visualization
          charts: {
            name: 'charts',
            test: /[\\/]node_modules[\\/](recharts|d3-)[\\/]/,
            priority: 20,
            chunks: 'all',
          },
          // PDF and file processing
          pdf: {
            name: 'pdf',
            test: /[\\/]node_modules[\\/](jspdf|csv-parser|papaparse)[\\/]/,
            priority: 20,
            chunks: 'all',
          },
          // Date utilities
          dates: {
            name: 'dates',
            test: /[\\/]node_modules[\\/](date-fns)[\\/]/,
            priority: 15,
            chunks: 'all',
          },
          // Other vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            minChunks: 1,
          },
          // Common application code
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            enforce: true,
          },
        },
      };

      // Client-side only optimizations
      if (!isServer) {
        // Tree shaking improvements
        config.optimization.usedExports = true;
        config.optimization.sideEffects = false;

        // Module concatenation (scope hoisting)
        config.optimization.concatenateModules = true;

        // Minimize bundle size
        config.optimization.minimize = true;
      }

      // Add webpack plugins for better optimization
      config.plugins.push(
        // Ignore moment.js locales to reduce bundle size
        new webpack.IgnorePlugin({
          resourceRegExp: /^\.\/locale$/,
          contextRegExp: /moment$/,
        })
      );
    }

    // Performance hints
    config.performance = {
      maxAssetSize: 512000, // 500 KB
      maxEntrypointSize: 512000, // 500 KB
      hints: 'warning',
    };

    return config;
  },

  // Enhanced image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 24 hours
    deviceSizes: [640, 768, 1024, 1280, 1600],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Output optimization
  output: 'standalone',

  // Compression
  compress: true,

  // Optimized headers for caching
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },

  // Server-side external packages (moved from experimental)
  serverExternalPackages: [
    '@supabase/supabase-js',
    'stripe',
    'bcryptjs',
    'jsonwebtoken',
    'pg',
    'resend',
    '@sendgrid/mail',
    'twilio',
    'web-push',
  ],

  // PWA-friendly configuration
  poweredByHeader: false,

  // Reduce verbose build output
  logging: {
    fetches: {
      fullUrl: false
    }
  },

  // Silent build output
  silent: process.env.NODE_ENV === 'production',

};

export default withBundleAnalyzer(nextConfig);