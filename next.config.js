/** @type {import('next').NextConfig} */
const nextConfig = {
  // External packages configuration
  serverExternalPackages: ['bcryptjs'],
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  output: 'standalone',
  
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
}

module.exports = nextConfig