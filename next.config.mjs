import bundleAnalyzer from '@next/bundle-analyzer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable type checking during builds to avoid memory issues
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Memory-optimized bundle configuration
  experimental: {
    optimizePackageImports: [
      // UI libraries with tree shaking
      '@heroicons/react',
      'lucide-react',
      '@radix-ui/react-label',
      '@radix-ui/react-slot',
      // Core utilities only
      'clsx',
      'tailwind-merge',
      // Date utilities for better tree shaking
      'date-fns',
    ],
    // Enable optimizeCss for better CSS bundling
    optimizeCss: true,
  },

  // Memory-optimized webpack configuration
  webpack: (config, { dev, isServer, webpack }) => {
    // Completely silence build output
    config.stats = 'none';
    config.infrastructureLogging = {
      level: 'error'
    };

    // AGGRESSIVE memory optimizations
    config.optimization.moduleIds = 'deterministic';
    config.optimization.chunkIds = 'deterministic';

    // Initialize splitChunks if not present
    if (!config.optimization.splitChunks) {
      config.optimization.splitChunks = {};
    }
    if (!config.optimization.splitChunks.cacheGroups) {
      config.optimization.splitChunks.cacheGroups = {};
    }

    // Reduce parallelism to save memory
    config.optimization.splitChunks.cacheGroups.default = false;
    config.optimization.splitChunks.cacheGroups.defaultVendors = false;

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
          // Framework chunk (React, Next.js core) - REDUCED
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            priority: 40,
            enforce: true,
          },
          // Core auth only - reduce auth bundle size
          auth: {
            name: 'auth-core',
            test: /[\\/]node_modules[\\/](@supabase\/ssr|@supabase\/auth-helpers-nextjs)[\\/]/,
            priority: 30,
            chunks: 'all',
          },
          // LAZY LOAD GROUPS - these won't be in main bundle
          // Charts are now async-only (no eager loading)
          charts: {
            name: 'charts-lazy',
            test: /[\\/]node_modules[\\/](recharts|d3-)[\\/]/,
            priority: 20,
            chunks: 'async', // Only load when actually needed
          },
          // PDF processing is async-only
          pdf: {
            name: 'pdf-lazy',
            test: /[\\/]node_modules[\\/](jspdf|csv-parser|papaparse)[\\/]/,
            priority: 20,
            chunks: 'async',
          },
          // Heavy libs are async-only
          heavy: {
            name: 'heavy-lazy',
            test: /[\\/]node_modules[\\/](@stripe|openai|twilio|web-push)[\\/]/,
            priority: 19,
            chunks: 'async',
          },
          // Smaller vendor chunk
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            minChunks: 2, // Require 2+ usage to include
            maxSize: 100000, // 100KB max per vendor chunk
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

        // Advanced minification options (use Next.js built-in minimizer)
        if (config.optimization.minimizer) {
          config.optimization.minimizer.forEach((minimizer) => {
            if (minimizer.constructor.name === 'TerserPlugin') {
              minimizer.options.terserOptions = {
                ...minimizer.options.terserOptions,
                compress: {
                  ...minimizer.options.terserOptions?.compress,
                  drop_console: true,
                  drop_debugger: true,
                  pure_funcs: ['console.log', 'console.info', 'console.debug'],
                },
              };
            }
          });
        }

        // Aggressive dead code elimination
        config.optimization.providedExports = true;
        config.optimization.innerGraph = true;
      }

      // Add webpack plugins for better optimization
      config.plugins.push(
        // Ignore moment.js locales to reduce bundle size
        new webpack.IgnorePlugin({
          resourceRegExp: /^\.\/locale$/,
          contextRegExp: /moment$/,
        }),
        // Ignore large unused libraries
        new webpack.IgnorePlugin({
          resourceRegExp: /^\.\/locale$/,
          contextRegExp: /date-fns$/,
        }),
        // Define plugin for dead code elimination
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify('production'),
          __DEV__: false,
        })
      );
    }

    // Enable persistent caching for faster builds
    config.cache = {
      type: 'filesystem',
      allowCollectingMemory: true,
      buildDependencies: {
        config: [__filename],
      },
    };

    // Resolve optimizations
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
      },
      // Reduce module resolution overhead
      modules: ['node_modules'],
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    };

    // Performance hints
    config.performance = {
      maxAssetSize: 400000, // 400 KB (reduced from 500KB)
      maxEntrypointSize: 400000, // 400 KB
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

  // Completely silent build output
  logging: {
    fetches: {
      fullUrl: false
    }
  },
};

export default withBundleAnalyzer(nextConfig);