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

    // Enable persistent caching for faster builds
    config.cache = {
      type: 'filesystem',
      allowCollectingMemory: true,
      buildDependencies: {
        config: [__filename],
      },
    };

    // Performance hints to manage bundle size
    config.performance = {
      hints: false, // Disable warnings to reduce noise
      maxAssetSize: 1000000, // 1MB
      maxEntrypointSize: 1000000, // 1MB
    };

    return config;
  },

  // Performance headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
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
};

export default withBundleAnalyzer(nextConfig);