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

    return config;
  },
};

export default withBundleAnalyzer(nextConfig);