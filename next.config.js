/** @type {import('next').NextConfig} */
const nextConfig = {
  // External packages configuration
  serverExternalPackages: ['bcryptjs'],
  
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